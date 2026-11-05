CREATE TYPE "runs"."schedule_tick_outcome" AS ENUM('fired', 'skipped_paused', 'skipped_changed', 'skipped_usage_limit', 'skipped_missed');--> statement-breakpoint
CREATE TABLE "runs"."schedule_ticks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"node_id" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"outcome" "runs"."schedule_tick_outcome" NOT NULL,
	"matched" integer NOT NULL,
	"started" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "runs"."schedule_ticks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "runs"."schedule_ticks" ADD CONSTRAINT "schedule_ticks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs"."schedule_ticks" ADD CONSTRAINT "schedule_ticks_workspace_id_agent_id_agents_fk" FOREIGN KEY ("workspace_id","agent_id") REFERENCES "agents"."agents"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs"."schedule_ticks" ADD CONSTRAINT "schedule_ticks_workspace_id_version_id_agent_versions_fk" FOREIGN KEY ("workspace_id","version_id") REFERENCES "agents"."agent_versions"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_ticks_tick_key" ON "runs"."schedule_ticks" USING btree ("workspace_id","agent_id","node_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "schedule_ticks_workspace_id_version_id_idx" ON "runs"."schedule_ticks" USING btree ("workspace_id","version_id");--> statement-breakpoint
CREATE POLICY "schedule_ticks_tenant_isolation" ON "runs"."schedule_ticks" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "runs"."schedule_ticks" FORCE ROW LEVEL SECURITY;
