CREATE SCHEMA "channels";
--> statement-breakpoint
CREATE TYPE "channels"."channel_event_type" AS ENUM('message', 'quick_reply');--> statement-breakpoint
CREATE TYPE "channels"."channel_kind" AS ENUM('telegram', 'api');--> statement-breakpoint
CREATE TYPE "channels"."channel_status" AS ENUM('pending', 'connected', 'broken', 'disconnected');--> statement-breakpoint
CREATE TABLE "channels"."channel_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"type" "channels"."channel_event_type" NOT NULL,
	"sender_external_id" text NOT NULL,
	"sender_name" text,
	"text" text,
	"sent_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels"."channel_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channels"."channel_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "channels"."channels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kind" "channels"."channel_kind" NOT NULL,
	"status" "channels"."channel_status" NOT NULL,
	"agent_id" uuid,
	"external_id" text NOT NULL,
	"identity" jsonb NOT NULL,
	"show_typing" boolean NOT NULL,
	"credentials_sealed" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels"."channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channels"."channels" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channels"."channel_events" ADD CONSTRAINT "channel_events_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "channel_events_channel_external_id_key" ON "channels"."channel_events" USING btree ("channel_id","external_id");--> statement-breakpoint
CREATE INDEX "channel_events_workspace_received_idx" ON "channels"."channel_events" USING btree ("workspace_id","received_at");--> statement-breakpoint
CREATE INDEX "channel_events_channel_received_idx" ON "channels"."channel_events" USING btree ("channel_id","received_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "channels_kind_external_id_key" ON "channels"."channels" USING btree ("kind","external_id");--> statement-breakpoint
CREATE INDEX "channels_workspace_kind_idx" ON "channels"."channels" USING btree ("workspace_id","kind");--> statement-breakpoint
CREATE INDEX "channels_agent_id_idx" ON "channels"."channels" USING btree ("agent_id");--> statement-breakpoint
CREATE POLICY "channel_events_tenant_isolation" ON "channels"."channel_events" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "channels_tenant_isolation" ON "channels"."channels" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);
