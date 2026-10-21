DROP INDEX "agents"."agents_workspace_id_idx";--> statement-breakpoint
ALTER TABLE "agents"."agents" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "agents_workspace_id_idx" ON "agents"."agents" USING btree ("workspace_id","id") WHERE "agents"."agents"."deleted_at" is null;