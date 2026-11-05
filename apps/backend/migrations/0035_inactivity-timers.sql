CREATE TABLE "runs"."inactivity_timers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"node_id" text NOT NULL,
	"anchor_at" timestamp with time zone NOT NULL,
	"attempt" integer NOT NULL,
	"due_at" timestamp with time zone,
	"lease_until" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "inactivity_timers_workspace_id_conversation_id_key" UNIQUE("workspace_id","conversation_id"),
	CONSTRAINT "inactivity_timers_attempt_check" CHECK ("runs"."inactivity_timers"."attempt" >= 0)
);
--> statement-breakpoint
ALTER TABLE "runs"."inactivity_timers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "runs"."inactivity_timers" ADD CONSTRAINT "inactivity_timers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs"."inactivity_timers" ADD CONSTRAINT "inactivity_timers_workspace_id_conversation_id_conversations_fk" FOREIGN KEY ("workspace_id","conversation_id") REFERENCES "conversations"."conversations"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs"."inactivity_timers" ADD CONSTRAINT "inactivity_timers_workspace_id_version_id_agent_versions_fk" FOREIGN KEY ("workspace_id","version_id") REFERENCES "agents"."agent_versions"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inactivity_timers_workspace_id_version_id_idx" ON "runs"."inactivity_timers" USING btree ("workspace_id","version_id");--> statement-breakpoint
CREATE INDEX "inactivity_timers_due_at_idx" ON "runs"."inactivity_timers" USING btree ("due_at") WHERE "runs"."inactivity_timers"."due_at" is not null;--> statement-breakpoint
CREATE POLICY "inactivity_timers_tenant_isolation" ON "runs"."inactivity_timers" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "runs"."inactivity_timers" FORCE ROW LEVEL SECURITY;
