CREATE SCHEMA "agents";
--> statement-breakpoint
CREATE TYPE "agents"."agent_version_kind" AS ENUM('draft', 'published', 'snapshot');--> statement-breakpoint
CREATE TYPE "agents"."pause_mode" AS ENUM('inbox', 'away_message');--> statement-breakpoint
CREATE TABLE "agents"."agent_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"kind" "agents"."agent_version_kind" NOT NULL,
	"number" integer,
	"flow" jsonb NOT NULL,
	"note" text,
	"author_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "agent_versions_number_only_when_published" CHECK (("agents"."agent_versions"."kind" = 'published') = ("agents"."agent_versions"."number" is not null))
);
--> statement-breakpoint
ALTER TABLE "agents"."agent_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agents"."agents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"live_version_id" uuid,
	"draft_version_id" uuid,
	"paused_at" timestamp with time zone,
	"pause_mode" "agents"."pause_mode",
	"away_message" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents"."agents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agents"."agent_versions" ADD CONSTRAINT "agent_versions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_versions_agent_id_number_key" ON "agents"."agent_versions" USING btree ("agent_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_versions_one_draft_key" ON "agents"."agent_versions" USING btree ("agent_id") WHERE "agents"."agent_versions"."kind" = 'draft';--> statement-breakpoint
CREATE INDEX "agent_versions_workspace_id_agent_id_idx" ON "agents"."agent_versions" USING btree ("workspace_id","agent_id");--> statement-breakpoint
CREATE INDEX "agents_workspace_id_idx" ON "agents"."agents" USING btree ("workspace_id","id");--> statement-breakpoint
CREATE POLICY "agent_versions_tenant_isolation" ON "agents"."agent_versions" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "agents_tenant_isolation" ON "agents"."agents" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "agents"."agents" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agents"."agent_versions" FORCE ROW LEVEL SECURITY;
