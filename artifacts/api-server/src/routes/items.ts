import { Router, type IRouter } from "express";
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
} from "drizzle-orm";
import {
  CreateItemBody,
  CreateItemResponse,
  GetDashboardStatsResponse,
  GetItemParams,
  GetItemResponse,
  GetRecentItemsQueryParams,
  GetRecentItemsResponse,
  ListItemMatchesParams,
  ListItemMatchesResponse,
  ListItemsQueryParams,
  ListItemsResponse,
  TriggerMatchParams,
  UpdateItemBody,
  UpdateItemParams,
  UpdateItemResponse,
} from "@workspace/api-zod";
import {
  db,
  itemMatchesTable,
  itemsTable,
} from "@workspace/db";
import { runMatchingForItem } from "../lib/matching";

const router: IRouter = Router();

function serializeItem(item: typeof itemsTable.$inferSelect) {
  return {
    id: item.id,
    report_type: item.reportType,
    category: item.category,
    title: item.title,
    description: item.description,
    image_url: item.imageUrl,
    location: item.location,
    event_time: item.eventTime,
    contact_info: item.contactInfo,
    status: item.status,
    created_at: item.createdAt,
  };
}

router.get("/items", async (req, res): Promise<void> => {
  const rawQuery: Record<string, unknown> = { ...req.query };
  if (typeof rawQuery.date_from === "string") {
    rawQuery.date_from = new Date(rawQuery.date_from);
  }
  if (typeof rawQuery.date_to === "string") {
    rawQuery.date_to = new Date(rawQuery.date_to);
  }
  const parsed = ListItemsQueryParams.safeParse(rawQuery);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, category, search, date_from, date_to, limit } = parsed.data;
  const filters = [
    type ? eq(itemsTable.reportType, type) : undefined,
    category ? eq(itemsTable.category, category) : undefined,
    eq(itemsTable.status, "active"),
    search
      ? or(
          ilike(itemsTable.title, `%${search}%`),
          ilike(itemsTable.description, `%${search}%`),
          ilike(itemsTable.location, `%${search}%`),
        )
      : undefined,
    date_from ? gte(itemsTable.eventTime, date_from) : undefined,
    date_to ? lte(itemsTable.eventTime, date_to) : undefined,
  ].filter(Boolean);
  const items = await db
    .select()
    .from(itemsTable)
    .where(and(...filters))
    .orderBy(desc(itemsTable.createdAt))
    .limit(limit);
  res.json(ListItemsResponse.parse(items.map(serializeItem)));
});

router.post("/items", async (req, res): Promise<void> => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [item] = await db
      .insert(itemsTable)
      .values({
        reportType: parsed.data.report_type,
        category: parsed.data.category,
        title: parsed.data.title,
        description: parsed.data.description,
        imageUrl: parsed.data.image_url,
        location: parsed.data.location,
        eventTime: parsed.data.event_time,
        contactInfo: parsed.data.contact_info,
      })
      .returning();
    res.status(201).json(CreateItemResponse.parse(serializeItem(item)));
    void runMatchingForItem(item.id).catch((error: unknown) => {
      req.log.error({ err: error, itemId: item.id }, "Background matching failed");
    });
  } catch (error) {
    req.log.error({ err: error }, "Could not create item");
    res.status(500).json({ error: "Could not create report" });
  }
});

router.get("/items/:id", async (req, res): Promise<void> => {
  const params = GetItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(GetItemResponse.parse(serializeItem(item)));
});

router.patch("/items/:id", async (req, res): Promise<void> => {
  const params = UpdateItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [item] = await db
    .update(itemsTable)
    .set({ status: body.data.status })
    .where(eq(itemsTable.id, params.data.id))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(UpdateItemResponse.parse(serializeItem(item)));
});

router.get("/items/:id/matches", async (req, res): Promise<void> => {
  const params = ListItemMatchesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .select({ id: itemsTable.id })
    .from(itemsTable)
    .where(eq(itemsTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  const matches = await db
    .select()
    .from(itemMatchesTable)
    .where(
      or(
        eq(itemMatchesTable.lostItemId, params.data.id),
        eq(itemMatchesTable.foundItemId, params.data.id),
      ),
    )
    .orderBy(desc(itemMatchesTable.confidenceScore));
  const matchedIds = matches.map((match) =>
    match.lostItemId === params.data.id ? match.foundItemId : match.lostItemId,
  );
  const matchedItems = matchedIds.length
    ? await db
        .select()
        .from(itemsTable)
        .where(inArray(itemsTable.id, matchedIds))
    : [];
  const itemById = new Map(matchedItems.map((matched) => [matched.id, matched]));
  const output = matches.flatMap((match) => {
    const matchedId =
      match.lostItemId === params.data.id ? match.foundItemId : match.lostItemId;
    const matchedItem = itemById.get(matchedId);
    return matchedItem
      ? [
          {
            id: match.id,
            lost_item_id: match.lostItemId,
            found_item_id: match.foundItemId,
            confidence_score: match.confidenceScore,
            explanation: match.explanation,
            created_at: match.createdAt,
            matched_item: serializeItem(matchedItem),
          },
        ]
      : [];
  });
  res.json(ListItemMatchesResponse.parse(output));
});

router.post("/trigger-match/:id", async (req, res): Promise<void> => {
  const params = TriggerMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .select({ id: itemsTable.id })
    .from(itemsTable)
    .where(eq(itemsTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  void runMatchingForItem(item.id).catch((error: unknown) => {
    req.log.error({ err: error, itemId: item.id }, "Manual matching failed");
  });
  res.sendStatus(204);
});

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [activeLost, activeFound, resolved, totalReports] = await Promise.all([
    db
      .select({ value: count() })
      .from(itemsTable)
      .where(and(eq(itemsTable.reportType, "lost"), eq(itemsTable.status, "active"))),
    db
      .select({ value: count() })
      .from(itemsTable)
      .where(and(eq(itemsTable.reportType, "found"), eq(itemsTable.status, "active"))),
    db
      .select({ value: count() })
      .from(itemsTable)
      .where(eq(itemsTable.status, "resolved")),
    db.select({ value: count() }).from(itemsTable),
  ]);
  res.json(
    GetDashboardStatsResponse.parse({
      active_lost: Number(activeLost[0]?.value ?? 0),
      active_found: Number(activeFound[0]?.value ?? 0),
      resolved: Number(resolved[0]?.value ?? 0),
      total_reports: Number(totalReports[0]?.value ?? 0),
    }),
  );
});

router.get("/dashboard/recent", async (req, res): Promise<void> => {
  const parsed = GetRecentItemsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const items = await db
    .select()
    .from(itemsTable)
    .orderBy(desc(itemsTable.createdAt))
    .limit(parsed.data.limit);
  res.json(GetRecentItemsResponse.parse(items.map(serializeItem)));
});

export default router;