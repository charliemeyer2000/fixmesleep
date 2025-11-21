CREATE TABLE "daily_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text DEFAULT 'self' NOT NULL,
	"metric_date" date NOT NULL,
	"total_sleep_minutes" integer,
	"deep_sleep_minutes" integer,
	"rem_sleep_minutes" integer,
	"readiness_score" numeric(5, 2),
	"avg_sleep_hrv" numeric(6, 2),
	"sleep_score" integer,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poke_action_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"tool_name" text NOT NULL,
	"request_payload" jsonb NOT NULL,
	"response_payload" jsonb NOT NULL,
	"status_code" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	"client_id" text DEFAULT 'poke' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "daily_metrics_user_date_idx" ON "daily_metrics" USING btree ("user_email","metric_date");--> statement-breakpoint
CREATE INDEX "daily_metrics_date_idx" ON "daily_metrics" USING btree ("metric_date");--> statement-breakpoint
CREATE INDEX "poke_action_logs_created_at_idx" ON "poke_action_logs" USING btree ("created_at");