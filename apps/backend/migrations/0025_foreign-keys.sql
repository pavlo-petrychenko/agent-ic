ALTER TABLE "agents"."agent_versions" DROP CONSTRAINT "agent_versions_agent_id_agents_id_fk";--> statement-breakpoint
ALTER TABLE "conversations"."messages" DROP CONSTRAINT "messages_conversation_id_conversations_id_fk";--> statement-breakpoint
ALTER TABLE "prompts"."prompts" DROP CONSTRAINT "prompts_folder_id_prompt_folders_id_fk";--> statement-breakpoint
ALTER TABLE "runs"."run_steps" DROP CONSTRAINT "run_steps_run_id_runs_id_fk";--> statement-breakpoint
DROP INDEX "agents"."agents_workspace_id_idx";--> statement-breakpoint
DROP INDEX "conversations"."messages_history_idx";--> statement-breakpoint
DROP INDEX "runs"."runs_conversation_latest_idx";--> statement-breakpoint
ALTER TABLE "runs"."runs" ALTER COLUMN "mode" SET DATA TYPE "conversations"."conversation_mode" USING "mode"::text::"conversations"."conversation_mode";--> statement-breakpoint
ALTER TABLE "identity"."workspaces" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."invite_links" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."role_permissions" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agents"."agents" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agents"."agent_versions" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversations"."conversations" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversations"."messages" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "runs"."runs" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "runs"."run_steps" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prompts"."prompt_folders" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prompts"."prompts" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prompts"."prompt_versions" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DELETE FROM "agents"."agents" o WHERE NOT EXISTS (SELECT 1 FROM "identity"."workspaces" w WHERE w."id" = o."workspace_id");--> statement-breakpoint
DELETE FROM "agents"."agent_versions" o WHERE NOT EXISTS (SELECT 1 FROM "identity"."workspaces" w WHERE w."id" = o."workspace_id") OR NOT EXISTS (SELECT 1 FROM "agents"."agents" t WHERE t."id" = o."agent_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
DELETE FROM "conversations"."conversations" o WHERE NOT EXISTS (SELECT 1 FROM "identity"."workspaces" w WHERE w."id" = o."workspace_id") OR NOT EXISTS (SELECT 1 FROM "agents"."agents" t WHERE t."id" = o."agent_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
DELETE FROM "conversations"."messages" o WHERE NOT EXISTS (SELECT 1 FROM "identity"."workspaces" w WHERE w."id" = o."workspace_id") OR NOT EXISTS (SELECT 1 FROM "conversations"."conversations" t WHERE t."id" = o."conversation_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
DELETE FROM "runs"."runs" o WHERE NOT EXISTS (SELECT 1 FROM "identity"."workspaces" w WHERE w."id" = o."workspace_id") OR NOT EXISTS (SELECT 1 FROM "conversations"."conversations" t WHERE t."id" = o."conversation_id" AND t."workspace_id" = o."workspace_id") OR NOT EXISTS (SELECT 1 FROM "agents"."agents" t WHERE t."id" = o."agent_id" AND t."workspace_id" = o."workspace_id") OR NOT EXISTS (SELECT 1 FROM "agents"."agent_versions" t WHERE t."id" = o."version_id" AND t."workspace_id" = o."workspace_id") OR NOT EXISTS (SELECT 1 FROM "conversations"."messages" t WHERE t."id" = o."last_covered_message_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
DELETE FROM "runs"."run_steps" o WHERE NOT EXISTS (SELECT 1 FROM "identity"."workspaces" w WHERE w."id" = o."workspace_id") OR NOT EXISTS (SELECT 1 FROM "runs"."runs" t WHERE t."id" = o."run_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
DELETE FROM "prompts"."prompt_folders" o WHERE NOT EXISTS (SELECT 1 FROM "identity"."workspaces" w WHERE w."id" = o."workspace_id");--> statement-breakpoint
DELETE FROM "prompts"."prompts" o WHERE NOT EXISTS (SELECT 1 FROM "identity"."workspaces" w WHERE w."id" = o."workspace_id") OR NOT EXISTS (SELECT 1 FROM "prompts"."prompt_folders" t WHERE t."id" = o."folder_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
DELETE FROM "prompts"."prompt_versions" o WHERE NOT EXISTS (SELECT 1 FROM "identity"."workspaces" w WHERE w."id" = o."workspace_id") OR NOT EXISTS (SELECT 1 FROM "prompts"."prompts" t WHERE t."id" = o."prompt_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
DELETE FROM "identity"."role_permissions" o WHERE NOT EXISTS (SELECT 1 FROM "identity"."workspaces" w WHERE w."id" = o."workspace_id");--> statement-breakpoint
UPDATE "agents"."agents" o SET "live_version_id" = NULL WHERE o."live_version_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "agents"."agent_versions" t WHERE t."id" = o."live_version_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
UPDATE "agents"."agents" o SET "draft_version_id" = NULL WHERE o."draft_version_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "agents"."agent_versions" t WHERE t."id" = o."draft_version_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
UPDATE "agents"."agent_versions" o SET "base_version_id" = NULL WHERE o."base_version_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "agents"."agent_versions" t WHERE t."id" = o."base_version_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
UPDATE "agents"."agent_versions" o SET "author_id" = NULL WHERE o."author_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "identity"."users" t WHERE t."id" = o."author_id");--> statement-breakpoint
UPDATE "prompts"."prompt_versions" o SET "author_id" = NULL WHERE o."author_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "identity"."users" t WHERE t."id" = o."author_id");--> statement-breakpoint
UPDATE "prompts"."prompts" o SET "created_by_user_id" = NULL WHERE o."created_by_user_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "identity"."users" t WHERE t."id" = o."created_by_user_id");--> statement-breakpoint
UPDATE "conversations"."conversations" o SET "handled_by" = NULL WHERE o."handled_by" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "identity"."users" t WHERE t."id" = o."handled_by");--> statement-breakpoint
UPDATE "conversations"."conversations" o SET "active_run_id" = NULL WHERE o."active_run_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "runs"."runs" t WHERE t."id" = o."active_run_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
UPDATE "conversations"."conversations" o SET "simulation_version_id" = NULL WHERE o."simulation_version_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "agents"."agent_versions" t WHERE t."id" = o."simulation_version_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
UPDATE "conversations"."messages" o SET "run_id" = NULL WHERE o."run_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "runs"."runs" t WHERE t."id" = o."run_id" AND t."workspace_id" = o."workspace_id");--> statement-breakpoint
UPDATE "identity"."users" o SET "last_workspace_id" = NULL WHERE o."last_workspace_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "identity"."workspaces" t WHERE t."id" = o."last_workspace_id");--> statement-breakpoint
UPDATE "identity"."users" o SET "pending_invite_link_id" = NULL WHERE o."pending_invite_link_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "identity"."invite_links" t WHERE t."id" = o."pending_invite_link_id");--> statement-breakpoint
ALTER TABLE "identity"."workspaces" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."invite_links" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."role_permissions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agents"."agents" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agents"."agent_versions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversations"."conversations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversations"."messages" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "runs"."runs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "runs"."run_steps" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prompts"."prompt_folders" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prompts"."prompts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prompts"."prompt_versions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agents"."agent_versions" ADD CONSTRAINT "agent_versions_workspace_id_id_key" UNIQUE("workspace_id","id");--> statement-breakpoint
ALTER TABLE "agents"."agents" ADD CONSTRAINT "agents_workspace_id_id_key" UNIQUE("workspace_id","id");--> statement-breakpoint
ALTER TABLE "conversations"."conversations" ADD CONSTRAINT "conversations_workspace_id_id_key" UNIQUE("workspace_id","id");--> statement-breakpoint
ALTER TABLE "conversations"."messages" ADD CONSTRAINT "messages_workspace_id_id_key" UNIQUE("workspace_id","id");--> statement-breakpoint
ALTER TABLE "prompts"."prompt_folders" ADD CONSTRAINT "prompt_folders_workspace_id_id_key" UNIQUE("workspace_id","id");--> statement-breakpoint
ALTER TABLE "runs"."runs" ADD CONSTRAINT "runs_workspace_id_id_key" UNIQUE("workspace_id","id");--> statement-breakpoint
ALTER TABLE "runs"."run_steps" ADD CONSTRAINT "run_steps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs"."runs" ADD CONSTRAINT "runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations"."messages" ADD CONSTRAINT "messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations"."conversations" ADD CONSTRAINT "conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents"."agent_versions" ADD CONSTRAINT "agent_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents"."agents" ADD CONSTRAINT "agents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts"."prompt_versions" ADD CONSTRAINT "prompt_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts"."prompts" ADD CONSTRAINT "prompts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts"."prompt_folders" ADD CONSTRAINT "prompt_folders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."role_permissions" ADD CONSTRAINT "role_permissions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents"."agent_versions" ADD CONSTRAINT "agent_versions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents"."agent_versions" ADD CONSTRAINT "agent_versions_workspace_id_agent_id_agents_fk" FOREIGN KEY ("workspace_id","agent_id") REFERENCES "agents"."agents"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents"."agents" ADD CONSTRAINT "agents_live_version_id_agent_versions_id_fk" FOREIGN KEY ("live_version_id") REFERENCES "agents"."agent_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents"."agents" ADD CONSTRAINT "agents_draft_version_id_agent_versions_id_fk" FOREIGN KEY ("draft_version_id") REFERENCES "agents"."agent_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations"."conversations" ADD CONSTRAINT "conversations_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations"."conversations" ADD CONSTRAINT "conversations_active_run_id_runs_id_fk" FOREIGN KEY ("active_run_id") REFERENCES "runs"."runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations"."conversations" ADD CONSTRAINT "conversations_simulation_version_id_agent_versions_id_fk" FOREIGN KEY ("simulation_version_id") REFERENCES "agents"."agent_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations"."conversations" ADD CONSTRAINT "conversations_workspace_id_agent_id_agents_fk" FOREIGN KEY ("workspace_id","agent_id") REFERENCES "agents"."agents"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations"."messages" ADD CONSTRAINT "messages_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "runs"."runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations"."messages" ADD CONSTRAINT "messages_workspace_id_conversation_id_conversations_fk" FOREIGN KEY ("workspace_id","conversation_id") REFERENCES "conversations"."conversations"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."users" ADD CONSTRAINT "users_pending_invite_link_id_invite_links_id_fk" FOREIGN KEY ("pending_invite_link_id") REFERENCES "identity"."invite_links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."users" ADD CONSTRAINT "users_last_workspace_id_workspaces_id_fk" FOREIGN KEY ("last_workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts"."prompt_versions" ADD CONSTRAINT "prompt_versions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts"."prompts" ADD CONSTRAINT "prompts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts"."prompts" ADD CONSTRAINT "prompts_workspace_id_folder_id_prompt_folders_fk" FOREIGN KEY ("workspace_id","folder_id") REFERENCES "prompts"."prompt_folders"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs"."run_steps" ADD CONSTRAINT "run_steps_workspace_id_run_id_runs_fk" FOREIGN KEY ("workspace_id","run_id") REFERENCES "runs"."runs"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs"."runs" ADD CONSTRAINT "runs_workspace_id_conversation_id_conversations_fk" FOREIGN KEY ("workspace_id","conversation_id") REFERENCES "conversations"."conversations"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs"."runs" ADD CONSTRAINT "runs_workspace_id_agent_id_agents_fk" FOREIGN KEY ("workspace_id","agent_id") REFERENCES "agents"."agents"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs"."runs" ADD CONSTRAINT "runs_workspace_id_version_id_agent_versions_fk" FOREIGN KEY ("workspace_id","version_id") REFERENCES "agents"."agent_versions"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs"."runs" ADD CONSTRAINT "runs_workspace_id_last_covered_message_id_messages_fk" FOREIGN KEY ("workspace_id","last_covered_message_id") REFERENCES "conversations"."messages"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels"."channel_events" ADD CONSTRAINT "channel_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels"."channels" ADD CONSTRAINT "channels_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels"."channels" ADD CONSTRAINT "channels_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels"."channels" ADD CONSTRAINT "channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_keys"."llm_keys" ADD CONSTRAINT "llm_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage"."usage_counters" ADD CONSTRAINT "usage_counters_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage"."workspace_limits" ADD CONSTRAINT "workspace_limits_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "channels_created_by_user_id_idx" ON "channels"."channels" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "agent_versions_author_id_idx" ON "agents"."agent_versions" USING btree ("author_id") WHERE "agents"."agent_versions"."author_id" is not null;--> statement-breakpoint
CREATE INDEX "agent_versions_base_version_id_idx" ON "agents"."agent_versions" USING btree ("base_version_id") WHERE "agents"."agent_versions"."base_version_id" is not null;--> statement-breakpoint
CREATE INDEX "agents_live_version_id_idx" ON "agents"."agents" USING btree ("live_version_id") WHERE "agents"."agents"."live_version_id" is not null;--> statement-breakpoint
CREATE INDEX "agents_draft_version_id_idx" ON "agents"."agents" USING btree ("draft_version_id") WHERE "agents"."agents"."draft_version_id" is not null;--> statement-breakpoint
CREATE INDEX "conversations_handled_by_idx" ON "conversations"."conversations" USING btree ("handled_by") WHERE "conversations"."conversations"."handled_by" is not null;--> statement-breakpoint
CREATE INDEX "conversations_active_run_id_idx" ON "conversations"."conversations" USING btree ("active_run_id") WHERE "conversations"."conversations"."active_run_id" is not null;--> statement-breakpoint
CREATE INDEX "conversations_simulation_version_id_idx" ON "conversations"."conversations" USING btree ("simulation_version_id") WHERE "conversations"."conversations"."simulation_version_id" is not null;--> statement-breakpoint
CREATE INDEX "messages_run_id_idx" ON "conversations"."messages" USING btree ("run_id") WHERE "conversations"."messages"."run_id" is not null;--> statement-breakpoint
CREATE INDEX "invite_links_workspace_id_role_id_idx" ON "identity"."invite_links" USING btree ("workspace_id","role_id");--> statement-breakpoint
CREATE INDEX "invite_links_created_by_user_id_idx" ON "identity"."invite_links" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "memberships_workspace_id_role_id_idx" ON "identity"."memberships" USING btree ("workspace_id","role_id");--> statement-breakpoint
CREATE INDEX "sessions_replaced_by_id_idx" ON "identity"."sessions" USING btree ("replaced_by_id") WHERE "identity"."sessions"."replaced_by_id" is not null;--> statement-breakpoint
CREATE INDEX "users_pending_invite_link_id_idx" ON "identity"."users" USING btree ("pending_invite_link_id") WHERE "identity"."users"."pending_invite_link_id" is not null;--> statement-breakpoint
CREATE INDEX "users_last_workspace_id_idx" ON "identity"."users" USING btree ("last_workspace_id") WHERE "identity"."users"."last_workspace_id" is not null;--> statement-breakpoint
CREATE INDEX "workspaces_created_by_user_id_idx" ON "identity"."workspaces" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "prompt_versions_author_id_idx" ON "prompts"."prompt_versions" USING btree ("author_id") WHERE "prompts"."prompt_versions"."author_id" is not null;--> statement-breakpoint
CREATE INDEX "prompts_created_by_user_id_idx" ON "prompts"."prompts" USING btree ("created_by_user_id") WHERE "prompts"."prompts"."created_by_user_id" is not null;--> statement-breakpoint
CREATE INDEX "run_steps_workspace_id_run_id_idx" ON "runs"."run_steps" USING btree ("workspace_id","run_id");--> statement-breakpoint
CREATE INDEX "runs_agent_mode_created_at_idx" ON "runs"."runs" USING btree ("workspace_id","agent_id","mode","created_at");--> statement-breakpoint
CREATE INDEX "runs_workspace_id_version_id_idx" ON "runs"."runs" USING btree ("workspace_id","version_id");--> statement-breakpoint
CREATE INDEX "runs_workspace_id_last_covered_message_id_idx" ON "runs"."runs" USING btree ("workspace_id","last_covered_message_id");--> statement-breakpoint
CREATE INDEX "messages_history_idx" ON "conversations"."messages" USING btree ("workspace_id","conversation_id","created_at","id");--> statement-breakpoint
CREATE INDEX "runs_conversation_latest_idx" ON "runs"."runs" USING btree ("workspace_id","conversation_id","created_at","id");--> statement-breakpoint
DROP TYPE "runs"."run_mode";
