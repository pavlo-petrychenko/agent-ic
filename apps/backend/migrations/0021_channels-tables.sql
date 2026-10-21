CREATE SCHEMA "channels";
--> statement-breakpoint
CREATE TYPE "channels"."channel_kind" AS ENUM('telegram', 'api');--> statement-breakpoint
CREATE TYPE "channels"."channel_status" AS ENUM('pending', 'connected', 'broken', 'disconnected');--> statement-breakpoint
CREATE TABLE "channels"."channel_updates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"received_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels"."channel_updates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "channels"."channels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kind" "channels"."channel_kind" NOT NULL,
	"status" "channels"."channel_status" NOT NULL,
	"agent_id" uuid,
	"name" text NOT NULL,
	"telegram_bot_id" text,
	"telegram_username" text,
	"token_sealed" text,
	"webhook_secret_hash" text,
	"show_typing" boolean NOT NULL,
	"last_update_at" timestamp with time zone,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels"."channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channels"."channel_updates" ADD CONSTRAINT "channel_updates_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "channel_updates_channel_external_id_key" ON "channels"."channel_updates" USING btree ("channel_id","external_id");--> statement-breakpoint
CREATE INDEX "channel_updates_workspace_received_idx" ON "channels"."channel_updates" USING btree ("workspace_id","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "channels_telegram_bot_id_key" ON "channels"."channels" USING btree ("telegram_bot_id") WHERE "channels"."channels"."telegram_bot_id" is not null and "channels"."channels"."status" <> 'disconnected';--> statement-breakpoint
CREATE INDEX "channels_workspace_kind_idx" ON "channels"."channels" USING btree ("workspace_id","kind");--> statement-breakpoint
CREATE INDEX "channels_agent_id_idx" ON "channels"."channels" USING btree ("agent_id");--> statement-breakpoint
CREATE POLICY "channel_updates_tenant_isolation" ON "channels"."channel_updates" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "channels_tenant_isolation" ON "channels"."channels" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "channels"."channels" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channels"."channel_updates" FORCE ROW LEVEL SECURITY;
