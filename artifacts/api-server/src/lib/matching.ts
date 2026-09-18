import { GoogleGenAI, Type } from "@google/genai";
import { and, eq, gte, lte } from "drizzle-orm";
import { db, itemMatchesTable, itemsTable, type Item } from "@workspace/db";
import { logger } from "./logger";

// Google retired gemini-2.5-flash for new API users; use the current flash model.
const model = "gemini-3.6-flash";
const systemInstruction =
  "You are an expert Lost & Found Matching AI for a smart campus system. " +
  "Determine the probability that a lost and found report describe the exact same physical object. " +
  "Consider visual characteristics from images, textual descriptions, and time and location logic. " +
  "Be objective and conservative. Only assign a score above 85 when highly specific unique identifiers " +
  "are present in both reports.";

type MatchDecision = {
  confidence_score: number;
  explanation: string;
};

function clampScore(value: unknown): number {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

async function imagePart(imageUrl: string) {
  if (!/^https?:\/\//i.test(imageUrl)) return null;
  try {
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return null;
    const mimeType = response.headers.get("content-type")?.split(";")[0];
    if (!mimeType?.startsWith("image/")) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > 8_000_000) return null;
    return {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType,
      },
    };
  } catch {
    return null;
  }
}

async function compareItems(lost: Item, found: Item): Promise<MatchDecision> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const [lostImage, foundImage] = await Promise.all([
    imagePart(lost.imageUrl),
    imagePart(found.imageUrl),
  ]);
  const prompt = `Compare the following LOST item with the FOUND item.

LOST ITEM:
Title: ${lost.title}
Category: ${lost.category}
Description: ${lost.description}
Location: ${lost.location}
Time: ${lost.eventTime.toISOString()}
Image URL: ${lost.imageUrl}

FOUND ITEM:
Title: ${found.title}
Category: ${found.category}
Description: ${found.description}
Location: ${found.location}
Time: ${found.eventTime.toISOString()}
Image URL: ${found.imageUrl}

Analyze the visual and textual data. Calculate a confidence score from 0 to 100 and provide a concise 2-3 sentence explanation.`;
  const parts = [
    { text: prompt },
    ...(lostImage ? [lostImage] : []),
    ...(foundImage ? [foundImage] : []),
  ];

  let response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              confidence_score: {
                type: Type.INTEGER,
                description: "Probability from 0 to 100.",
              },
              explanation: {
                type: Type.STRING,
                description: "A concise explanation referencing concrete details.",
              },
            },
            required: ["confidence_score", "explanation"],
          },
        },
      });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt));
    }
  }

  const raw = response?.text ?? "{}";
  const parsed = JSON.parse(raw) as Partial<MatchDecision>;
  return {
    confidence_score: clampScore(parsed.confidence_score),
    explanation:
      typeof parsed.explanation === "string" && parsed.explanation.trim()
        ? parsed.explanation.trim()
        : "The reports share a category, but the available details are not specific enough to confirm a match.",
  };
}

function heuristicCompare(lost: Item, found: Item): MatchDecision {
  const lostText = `${lost.title} ${lost.description}`.toLowerCase();
  const foundText = `${found.title} ${found.description}`.toLowerCase();
  const sharedWords = new Set(
    lostText
      .split(/\W+/)
      .filter((word) => word.length > 3 && foundText.includes(word)),
  );
  const score = Math.min(78, 24 + sharedWords.size * 11);
  return {
    confidence_score: score,
    explanation:
      sharedWords.size > 0
        ? `Both reports are in the ${lost.category.toLowerCase()} category and share details about ${[...sharedWords].slice(0, 3).join(", ")}. Image analysis was unavailable, so this is a preliminary lead rather than a confirmed match.`
        : `Both reports are in the ${lost.category.toLowerCase()} category, but their text does not contain enough shared identifying detail for a strong match.`,
  };
}

export async function runMatchingForItem(itemId: string): Promise<void> {
  const [item] = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.id, itemId));
  if (!item) return;

  const candidates = await db
    .select()
    .from(itemsTable)
    .where(
      and(
        eq(itemsTable.category, item.category),
        eq(itemsTable.status, "active"),
        item.reportType === "lost"
          ? and(
              eq(itemsTable.reportType, "found"),
              gte(itemsTable.eventTime, item.eventTime),
            )
          : and(
              eq(itemsTable.reportType, "lost"),
              lte(itemsTable.eventTime, item.eventTime),
            ),
      ),
    )
    .limit(12);

  const lost = item.reportType === "lost" ? item : null;
  for (const candidate of candidates) {
    const found = item.reportType === "lost" ? candidate : item;
    const lostItem = lost ?? candidate;
    let decision: MatchDecision;
    try {
      decision = await compareItems(lostItem, found);
    } catch (error) {
      logger.warn({ err: error, itemId, candidateId: candidate.id }, "Gemini match failed; using preliminary comparison");
      decision = heuristicCompare(lostItem, found);
    }

    await db
      .insert(itemMatchesTable)
      .values({
        lostItemId: lostItem.id,
        foundItemId: found.id,
        confidenceScore: decision.confidence_score,
        explanation: decision.explanation,
      })
      .onConflictDoUpdate({
        target: [itemMatchesTable.lostItemId, itemMatchesTable.foundItemId],
        set: {
          confidenceScore: decision.confidence_score,
          explanation: decision.explanation,
          createdAt: new Date(),
        },
      });
  }
}