CREATE SCHEMA "usage";
--> statement-breakpoint
CREATE TABLE "usage"."usage_counters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"period" text NOT NULL,
	"credits" numeric(14, 4) DEFAULT 0 NOT NULL,
	"conversations" integer DEFAULT 0 NOT NULL,
	"warned_80_at" timestamp with time zone,
	"warned_100_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "usage_counters_workspace_id_period_key" UNIQUE("workspace_id","period"),
	CONSTRAINT "usage_counters_period_format" CHECK ("usage"."usage_counters"."period" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
ALTER TABLE "usage"."usage_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "usage"."workspace_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"credits_limit" numeric(14, 4),
	"conversations_limit" integer,
	"chunks_limit" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_limits_workspace_id_key" UNIQUE("workspace_id")
);
--> statement-breakpoint
ALTER TABLE "usage"."workspace_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "usage_counters_tenant_isolation" ON "usage"."usage_counters" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "workspace_limits_tenant_isolation" ON "usage"."workspace_limits" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "usage"."usage_counters" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usage"."workspace_limits" FORCE ROW LEVEL SECURITY;
