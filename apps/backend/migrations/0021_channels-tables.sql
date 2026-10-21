CREATE SCHEMA "channels";
--> statement-breakpoint
CREATE TYPE "channels"."channel_kind" AS ENUM('telegram', 'api');--> statement-breakpoint
CREATE TYPE "channels"."channel_status" AS ENUM('pending', 'connected', 'broken', 'disconnected');--> statement-breakpoint
CREATE TABLE "channels"."channel_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels"."channel_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "channels"."channels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kind" "channels"."channel_kind" NOT NULL,
	"status" "channels"."channel_status" NOT NULL,
	"agent_id" uuid,
	"last_update_at" timestamp with time zone,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels"."channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "channels"."telegram_channels" (
	"channel_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"bot_id" text NOT NULL,
	"username" text NOT NULL,
	"token_sealed" text NOT NULL,
	"webhook_secret_hash" text,
	"show_typing" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels"."telegram_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channels"."channel_events" ADD CONSTRAINT "channel_events_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels"."telegram_channels" ADD CONSTRAINT "telegram_channels_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "channel_events_channel_external_id_key" ON "channels"."channel_events" USING btree ("channel_id","external_id");--> statement-breakpoint
CREATE INDEX "channel_events_workspace_received_idx" ON "channels"."channel_events" USING btree ("workspace_id","received_at");--> statement-breakpoint
CREATE INDEX "channel_events_channel_received_idx" ON "channels"."channel_events" USING btree ("channel_id","received_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "channels_workspace_kind_idx" ON "channels"."channels" USING btree ("workspace_id","kind");--> statement-breakpoint
CREATE INDEX "channels_agent_id_idx" ON "channels"."channels" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_channels_bot_id_key" ON "channels"."telegram_channels" USING btree ("bot_id") WHERE "channels"."telegram_channels"."bot_id" is not null;--> statement-breakpoint
CREATE POLICY "channel_events_tenant_isolation" ON "channels"."channel_events" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "channels_tenant_isolation" ON "channels"."channels" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "telegram_channels_tenant_isolation" ON "channels"."telegram_channels" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "channels"."channels" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channels"."channel_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channels"."telegram_channels" FORCE ROW LEVEL SECURITY;