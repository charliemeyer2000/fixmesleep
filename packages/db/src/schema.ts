import {
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  integer,
  date,
  doublePrecision
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const dailyMetrics = pgTable(
  "daily_metrics",
  {
    id: serial("id").primaryKey(),
    userEmail: text("user_email").notNull().default("self"),
    metricDate: date("metric_date").notNull(),
    totalSleepMinutes: integer("total_sleep_minutes"),
    deepSleepMinutes: integer("deep_sleep_minutes"),
    remSleepMinutes: integer("rem_sleep_minutes"),
    readinessScore: doublePrecision("readiness_score"),
    avgSleepHrv: doublePrecision("avg_sleep_hrv"),
    sleepScore: integer("sleep_score"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  table => ({
    uniqMetric: uniqueIndex("daily_metrics_user_date_idx").on(
      table.userEmail,
      table.metricDate
    ),
    dateIdx: index("daily_metrics_date_idx").on(table.metricDate)
  })
);

export const pokeActionLogs = pgTable(
  "poke_action_logs",
  {
    id: serial("id").primaryKey(),
    endpoint: text("endpoint").notNull(),
    toolName: text("tool_name").notNull(),
    requestPayload: jsonb("request_payload").$type<Record<string, unknown>>().notNull(),
    responsePayload: jsonb("response_payload").$type<Record<string, unknown>>().notNull(),
    statusCode: integer("status_code").notNull(),
    durationMs: integer("duration_ms").notNull(),
    clientId: text("client_id").notNull().default("poke"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  table => ({
    createdAtIdx: index("poke_action_logs_created_at_idx").on(table.createdAt)
  })
);

const payloadSchema = z.record(z.any());

export const insertDailyMetricSchema = createInsertSchema(dailyMetrics, {
  metricDate: z.coerce.date(),
  payload: payloadSchema
});

export const selectDailyMetricSchema = createSelectSchema(dailyMetrics, {
  metricDate: z.coerce.date(),
  payload: payloadSchema
});

export const insertPokeActionSchema = createInsertSchema(pokeActionLogs, {
  requestPayload: payloadSchema,
  responsePayload: payloadSchema
});

export const selectPokeActionSchema = createSelectSchema(pokeActionLogs, {
  requestPayload: payloadSchema,
  responsePayload: payloadSchema
});

export type DailyMetricInsert = z.infer<typeof insertDailyMetricSchema>;
export type DailyMetricRecord = z.infer<typeof selectDailyMetricSchema>;
export type PokeActionLogInsert = z.infer<typeof insertPokeActionSchema>;
export type PokeActionLogRecord = z.infer<typeof selectPokeActionSchema>;
export type DailyMetricRow = typeof dailyMetrics.$inferSelect;
