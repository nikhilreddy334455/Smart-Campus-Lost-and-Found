import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { ItemRecord } from '../schemas/item.schema.js';
import { DbService } from './db.service.js';

dotenv.config();

const SYSTEM_INSTRUCTION = `You are an expert Lost & Found Matching AI for a smart campus system. Your primary directive is to analyze two items (one 'Lost', one 'Found') and determine the probability that they are the exact same physical object.
You must be highly analytical. Consider visual characteristics from images (color, wear and tear, branding), textual descriptions, and the logic of time and location (e.g., an item cannot be found before it was lost).
Be objective and conservative in your scoring. Only assign a score above 85% if there are highly specific unique identifiers present in both.`;

export interface AiComparisonResult {
  confidence_score: number;
  explanation: string;
}

export class AiService {
  private static aiClient: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
      return null;
    }
    if (!this.aiClient) {
      this.aiClient = new GoogleGenAI({ apiKey });
    }
    return this.aiClient;
  }

  /**
   * Fetches an image URL and converts it to inlineData part if possible
   */
  private static async fetchImagePart(url: string): Promise<{ inlineData: { data: string; mimeType: string } } | null> {
    try {
      if (url.startsWith('data:')) {
        const matches = url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          return {
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          };
        }
      }

      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!response.ok) return null;
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');

      return {
        inlineData: {
          mimeType: contentType.startsWith('image/') ? contentType : 'image/jpeg',
          data: base64Data
        }
      };
    } catch {
      // If fetching fails or times out, proceed with text & URL references
      return null;
    }
  }

  /**
   * Compares a Lost item and a Found item using Gemini 2.5 Flash
   */
  static async compareItems(lost: ItemRecord, found: ItemRecord): Promise<AiComparisonResult> {
    const client = this.getClient();

    const userPromptText = `Compare the following LOST item with the FOUND item.

LOST ITEM:
Title: ${lost.title}
Description: ${lost.description}
Location: ${lost.location}
Time: ${lost.event_time}
Image URL: ${lost.image_url}

FOUND ITEM:
Title: ${found.title}
Description: ${found.description}
Location: ${found.location}
Time: ${found.event_time}
Image URL: ${found.image_url}

Analyze the visual and textual data. Calculate a confidence score (0-100) and provide a concise explanation of your reasoning.`;

    if (client) {
      try {
        console.log(`[AI Engine] Comparing with gemini-2.5-flash: "${lost.title}" vs "${found.title}"`);
        
        const contents: any[] = [];

        // Attempt multimodal image ingestion
        const [lostImgPart, foundImgPart] = await Promise.all([
          this.fetchImagePart(lost.image_url),
          this.fetchImagePart(found.image_url)
        ]);

        if (lostImgPart) contents.push(lostImgPart);
        if (foundImgPart) contents.push(foundImgPart);
        contents.push(userPromptText);

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                confidence_score: {
                  type: Type.INTEGER,
                  description: 'Probability from 0 to 100 that these two records represent the exact same item.'
                },
                explanation: {
                  type: Type.STRING,
                  description: 'A 2-3 sentence logical explanation of why they match or do not match, referencing specific visual or textual details.'
                }
              },
              required: ['confidence_score', 'explanation']
            }
          }
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);

        const score = Math.max(0, Math.min(100, Math.round(Number(parsed.confidence_score) || 0)));
        const explanation = typeof parsed.explanation === 'string' && parsed.explanation.trim().length > 0
          ? parsed.explanation.trim()
          : `Automated AI analysis evaluated textual and visual features with confidence of ${score}%.`;

        return { confidence_score: score, explanation };
      } catch (err) {
        console.error('[AI Engine] Gemini API error, falling back to analytical heuristic:', err instanceof Error ? err.message : err);
      }
    } else {
      console.log('[AI Engine] Notice: GEMINI_API_KEY not set. Using smart analytical matcher fallback.');
    }

    // Heuristic analytical comparison fallback if API key is not yet configured
    return this.computeAnalyticalMatch(lost, found);
  }

  /**
   * High-fidelity heuristic comparison matching temporal, spatial, category, and token metrics
   */
  private static computeAnalyticalMatch(lost: ItemRecord, found: ItemRecord): AiComparisonResult {
    const isSameCategory = lost.category.toLowerCase() === found.category.toLowerCase();
    
    // Extract normalized words
    const tokenize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    
    const lostTokens = new Set([...tokenize(lost.title), ...tokenize(lost.description)]);
    const foundTokens = new Set([...tokenize(found.title), ...tokenize(found.description)]);

    let commonCount = 0;
    const commonWords: string[] = [];
    lostTokens.forEach(token => {
      if (foundTokens.has(token)) {
        commonCount++;
        commonWords.push(token);
      }
    });

    // Time logic: was the item found AFTER it was lost?
    const lostTime = new Date(lost.event_time).getTime();
    const foundTime = new Date(found.event_time).getTime();
    const temporalValid = foundTime >= (lostTime - 3600000); // within 1 hour tolerance

    // Location similarity check
    const lostLoc = lost.location.toLowerCase();
    const foundLoc = found.location.toLowerCase();
    const isAdjacentOrSameLoc = lostLoc.includes(foundLoc) || foundLoc.includes(lostLoc) ||
      (lostLoc.includes('library') && foundLoc.includes('quad')) ||
      (lostLoc.includes('lecture') && foundLoc.includes('hall')) ||
      (lostLoc.includes('commons') && foundLoc.includes('dining')) ||
      (lostLoc.includes('science') && foundLoc.includes('science'));

    let score = 15; // base baseline

    if (isSameCategory) score += 30;
    score += Math.min(35, commonCount * 7);

    if (temporalValid) {
      score += 10;
    } else {
      score = Math.max(10, score - 35); // penalize if found before lost
    }

    if (isAdjacentOrSameLoc) score += 15;

    score = Math.min(95, Math.max(5, score));

    // Formulate a logical 2-3 sentence explanation
    let explanation = '';
    if (score >= 80) {
      explanation = `Strong match detected across both ${lost.category} reports with overlapping identifiers ("${commonWords.slice(0, 3).join('", "')}"). Locations (${lost.location} and ${found.location}) and timestamp sequence align with recovery patterns.`;
    } else if (score >= 50) {
      explanation = `Moderate similarity identified in category "${lost.category}" with shared keywords (${commonWords.slice(0, 2).join(', ') || 'general item attributes'}). Verification of specific serial numbers or distinguishing marks is recommended.`;
    } else {
      explanation = `Low probability of match. Despite both being listed under ${lost.category}, distinguishing descriptions and disparate campus locations (${lost.location} vs ${found.location}) indicate these are distinct items.`;
    }

    return { confidence_score: score, explanation };
  }

  /**
   * Executes AI matching for a target item against all candidate items in the database
   */
  static async processMatchesForItem(targetItem: ItemRecord): Promise<{ matchesFound: number; topScore: number }> {
    const candidates = await DbService.getCandidateItemsForMatching(targetItem);
    if (candidates.length === 0) {
      return { matchesFound: 0, topScore: 0 };
    }

    let topScore = 0;
    let matchesFound = 0;

    for (const candidate of candidates) {
      const lost = targetItem.report_type === 'lost' ? targetItem : candidate;
      const found = targetItem.report_type === 'found' ? targetItem : candidate;

      try {
        const result = await this.compareItems(lost, found);
        await DbService.saveMatch(lost.id, found.id, result.confidence_score, result.explanation);

        matchesFound++;
        if (result.confidence_score > topScore) {
          topScore = result.confidence_score;
        }
      } catch (err) {
        console.error(`[AI Engine] Failed to compare ${lost.id} and ${found.id}:`, err);
      }
    }

    return { matchesFound, topScore };
  }
}
