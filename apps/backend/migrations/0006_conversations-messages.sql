CREATE SCHEMA "conversations";
--> statement-breakpoint
CREATE TYPE "conversations"."channel_kind" AS ENUM('simulated', 'telegram', 'api');--> statement-breakpoint
CREATE TYPE "conversations"."conversation_mode" AS ENUM('live', 'simulation');--> statement-breakpoint
CREATE TYPE "conversations"."conversation_state" AS ENUM('agent_active', 'waiting', 'handled', 'closed');--> statement-breakpoint
CREATE TYPE "conversations"."message_author" AS ENUM('customer', 'agent', 'operator', 'system');--> statement-breakpoint
CREATE TYPE "conversations"."message_delivery" AS ENUM('pending', 'delivered', 'failed');--> statement-breakpoint
CREATE TABLE "conversations"."conversations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"mode" "conversations"."conversation_mode" NOT NULL,
	"channel_kind" "conversations"."channel_kind" NOT NULL,
	"channel_id" text,
	"end_user_external_id" text NOT NULL,
	"end_user_name" text,
	"state" "conversations"."conversation_state" NOT NULL,
	"handled_by" uuid,
	"active_run_id" uuid,
	"away_sent_at" timestamp with time zone,
	"last_message_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations"."conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "conversations"."messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"author" "conversations"."message_author" NOT NULL,
	"text" text NOT NULL,
	"quick_replies" text[] NOT NULL,
	"external_id" text,
	"idempotency_key" text,
	"delivery" "conversations"."message_delivery",
	"run_id" uuid,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations"."messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversations"."messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversations_end_user_idx" ON "conversations"."conversations" USING btree ("workspace_id","agent_id","channel_kind","end_user_external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_conversation_id_external_id_key" ON "conversations"."messages" USING btree ("conversation_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_workspace_id_idempotency_key_key" ON "conversations"."messages" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_id_idx" ON "conversations"."messages" USING btree ("conversation_id","id");--> statement-breakpoint
CREATE POLICY "conversations_tenant_isolation" ON "conversations"."conversations" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "messages_tenant_isolation" ON "conversations"."messages" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "conversations"."conversations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversations"."messages" FORCE ROW LEVEL SECURITY;