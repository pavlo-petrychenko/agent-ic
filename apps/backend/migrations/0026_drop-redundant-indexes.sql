DROP INDEX "identity"."roles_workspace_id_idx";--> statement-breakpoint
DROP INDEX "prompts"."prompt_versions_prompt_id_number_key";--> statement-breakpoint
DROP INDEX "prompts"."prompt_versions_workspace_id_prompt_id_number_idx";--> statement-breakpoint
DROP INDEX "conversations"."conversations_end_user_idx";--> statement-breakpoint
DROP INDEX "prompts"."prompt_folders_workspace_id_name_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_versions_workspace_id_prompt_id_number_key" ON "prompts"."prompt_versions" USING btree ("workspace_id","prompt_id","number");--> statement-breakpoint
CREATE INDEX "conversations_end_user_idx" ON "conversations"."conversations" USING btree ("workspace_id","agent_id","end_user_external_id","channel_kind","mode");--> statement-breakpoint
CREATE INDEX "prompt_folders_workspace_id_name_idx" ON "prompts"."prompt_folders" USING btree ("workspace_id","name") WHERE "prompts"."prompt_folders"."deleted_at" is null;