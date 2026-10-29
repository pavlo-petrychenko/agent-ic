CREATE TABLE "conversations"."schedule_contacts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"node_id" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"once_per_conversation" boolean NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations"."schedule_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversations"."schedule_contacts" ADD CONSTRAINT "schedule_contacts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations"."schedule_contacts" ADD CONSTRAINT "schedule_contacts_workspace_id_conversation_id_conversations_fk" FOREIGN KEY ("workspace_id","conversation_id") REFERENCES "conversations"."conversations"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations"."schedule_contacts" ADD CONSTRAINT "schedule_contacts_workspace_id_agent_id_agents_fk" FOREIGN KEY ("workspace_id","agent_id") REFERENCES "agents"."agents"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_contacts_tick_key" ON "conversations"."schedule_contacts" USING btree ("workspace_id","conversation_id","agent_id","node_id","scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_contacts_once_key" ON "conversations"."schedule_contacts" USING btree ("workspace_id","conversation_id","agent_id","node_id") WHERE "conversations"."schedule_contacts"."once_per_conversation";--> statement-breakpoint
CREATE INDEX "schedule_contacts_workspace_id_agent_id_idx" ON "conversations"."schedule_contacts" USING btree ("workspace_id","agent_id");--> statement-breakpoint
CREATE INDEX "conversations_schedule_candidates_idx" ON "conversations"."conversations" USING btree ("workspace_id","agent_id","last_customer_message_at") WHERE "conversations"."conversations"."mode" = 'live' and "conversations"."conversations"."state" = 'agent_active';--> statement-breakpoint
CREATE POLICY "schedule_contacts_tenant_isolation" ON "conversations"."schedule_contacts" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "conversations"."schedule_contacts" FORCE ROW LEVEL SECURITY;
