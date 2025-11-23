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
    // Core sleep metrics
    totalSleepMinutes: integer("total_sleep_minutes"),
    deepSleepMinutes: integer("deep_sleep_minutes"),
    remSleepMinutes: integer("rem_sleep_minutes"),
    lightSleepMinutes: integer("light_sleep_minutes"),
    sleepScore: integer("sleep_score"),
    sleepEfficiency: doublePrecision("sleep_efficiency"),
    restorativeSleepMinutes: integer("restorative_sleep_minutes"),
    temperatureDeviation: doublePrecision("temperature_deviation"),
    // Sleep details
    bedtimeStart: integer("bedtime_start"), // Unix timestamp
    bedtimeEnd: integer("bedtime_end"), // Unix timestamp
    timeInBedMinutes: integer("time_in_bed_minutes"),
    tossesAndTurns: integer("tosses_and_turns"),
    movements: integer("movements"),
    morningAlertnessMinutes: integer("morning_alertness_minutes"),
    averageBodyTempCelsius: doublePrecision("average_body_temp_celsius"),
    // Heart metrics
    avgSleepHrv: doublePrecision("avg_sleep_hrv"),
    nightRhr: doublePrecision("night_rhr"),
    sleepRhr: doublePrecision("sleep_rhr"),
    // Recovery & activity
    readinessScore: doublePrecision("readiness_score"),
    recoveryIndex: doublePrecision("recovery_index"),
    movementIndex: doublePrecision("movement_index"),
    activeMinutes: integer("active_minutes"),
    vo2Max: doublePrecision("vo2_max"),
    metabolicScore: doublePrecision("metabolic_score"),
    // Full payload for any additional data
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
