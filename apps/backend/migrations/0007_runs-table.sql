CREATE SCHEMA "runs";
--> statement-breakpoint
CREATE TYPE "runs"."run_mode" AS ENUM('live', 'simulation');--> statement-breakpoint
CREATE TYPE "runs"."run_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'escalated');--> statement-breakpoint
CREATE TYPE "runs"."run_trigger" AS ENUM('message');--> statement-breakpoint
CREATE TABLE "runs"."runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"mode" "runs"."run_mode" NOT NULL,
	"trigger" "runs"."run_trigger" NOT NULL,
	"status" "runs"."run_status" NOT NULL,
	"last_covered_message_id" uuid NOT NULL,
	"error" jsonb,
	"trace_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "runs"."runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "runs_tenant_isolation" ON "runs"."runs" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "runs"."runs" FORCE ROW LEVEL SECURITY;