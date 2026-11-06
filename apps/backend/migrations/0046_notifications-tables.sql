CREATE SCHEMA "notifications";
--> statement-breakpoint
CREATE TYPE "notifications"."notification_channel" AS ENUM('platform', 'email', 'telegram');--> statement-breakpoint
CREATE TYPE "notifications"."notification_delivery_status" AS ENUM('pending', 'delivered', 'failed', 'read');--> statement-breakpoint
CREATE TYPE "notifications"."notification_kind" AS ENUM('escalation', 'reminder');--> statement-breakpoint
CREATE TABLE "notifications"."email_notification_channels" (
	"channel_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications"."email_notification_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications"."notification_channels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"settings_id" uuid NOT NULL,
	"channel" "notifications"."notification_channel" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "notification_channels_workspace_id_id_key" UNIQUE("workspace_id","id"),
	CONSTRAINT "notification_channels_settings_id_channel_key" UNIQUE("settings_id","channel")
);
--> statement-breakpoint
ALTER TABLE "notifications"."notification_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications"."notification_deliveries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"notification_id" uuid NOT NULL,
	"channel" "notifications"."notification_channel" NOT NULL,
	"status" "notifications"."notification_delivery_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "notification_deliveries_notification_id_channel_key" UNIQUE("notification_id","channel")
);
--> statement-breakpoint
ALTER TABLE "notifications"."notification_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications"."notification_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "notification_settings_workspace_id_id_key" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
ALTER TABLE "notifications"."notification_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications"."notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"run_step_id" uuid NOT NULL,
	"kind" "notifications"."notification_kind" NOT NULL,
	"last_customer_message_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "notifications_workspace_id_id_key" UNIQUE("workspace_id","id"),
	CONSTRAINT "notifications_run_step_id_user_id_kind_key" UNIQUE("run_step_id","user_id","kind")
);
--> statement-breakpoint
ALTER TABLE "notifications"."notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications"."telegram_notification_channels" (
	"channel_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"chat_id" text,
	"linked_at" timestamp with time zone,
	"link_code_hash" text,
	"link_code_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications"."telegram_notification_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications"."email_notification_channels" ADD CONSTRAINT "email_notification_channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."email_notification_channels" ADD CONSTRAINT "email_notification_channels_workspace_id_channel_id_channels_fk" FOREIGN KEY ("workspace_id","channel_id") REFERENCES "notifications"."notification_channels"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."notification_channels" ADD CONSTRAINT "notification_channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."notification_channels" ADD CONSTRAINT "notification_channels_workspace_id_settings_id_settings_fk" FOREIGN KEY ("workspace_id","settings_id") REFERENCES "notifications"."notification_settings"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."notification_deliveries" ADD CONSTRAINT "notification_deliveries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."notification_deliveries" ADD CONSTRAINT "notification_deliveries_workspace_id_notification_id_notifications_fk" FOREIGN KEY ("workspace_id","notification_id") REFERENCES "notifications"."notifications"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."notification_settings" ADD CONSTRAINT "notification_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."notifications" ADD CONSTRAINT "notifications_run_step_id_run_steps_id_fk" FOREIGN KEY ("run_step_id") REFERENCES "runs"."run_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."notifications" ADD CONSTRAINT "notifications_workspace_id_last_customer_message_id_messages_fk" FOREIGN KEY ("workspace_id","last_customer_message_id") REFERENCES "conversations"."messages"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."telegram_notification_channels" ADD CONSTRAINT "telegram_notification_channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."telegram_notification_channels" ADD CONSTRAINT "telegram_notification_channels_workspace_id_channel_id_channels_fk" FOREIGN KEY ("workspace_id","channel_id") REFERENCES "notifications"."notification_channels"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_notification_channels_workspace_id_channel_id_idx" ON "notifications"."email_notification_channels" USING btree ("workspace_id","channel_id");--> statement-breakpoint
CREATE INDEX "notification_channels_workspace_id_settings_id_idx" ON "notifications"."notification_channels" USING btree ("workspace_id","settings_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_workspace_id_status_created_at_idx" ON "notifications"."notification_deliveries" USING btree ("workspace_id","status","created_at");--> statement-breakpoint
CREATE INDEX "notification_deliveries_workspace_id_notification_id_idx" ON "notifications"."notification_deliveries" USING btree ("workspace_id","notification_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_settings_workspace_id_user_id_key" ON "notifications"."notification_settings" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "notification_settings_user_id_idx" ON "notifications"."notification_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_workspace_id_user_id_created_at_idx" ON "notifications"."notifications" USING btree ("workspace_id","user_id","created_at" desc);--> statement-breakpoint
CREATE INDEX "notifications_workspace_id_run_step_id_idx" ON "notifications"."notifications" USING btree ("workspace_id","run_step_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications"."notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_workspace_id_last_customer_message_id_idx" ON "notifications"."notifications" USING btree ("workspace_id","last_customer_message_id") WHERE "notifications"."notifications"."last_customer_message_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_notification_channels_link_code_hash_key" ON "notifications"."telegram_notification_channels" USING btree ("link_code_hash") WHERE "notifications"."telegram_notification_channels"."link_code_hash" is not null;--> statement-breakpoint
CREATE INDEX "telegram_notification_channels_workspace_id_channel_id_idx" ON "notifications"."telegram_notification_channels" USING btree ("workspace_id","channel_id");--> statement-breakpoint
CREATE INDEX "telegram_notification_channels_workspace_id_chat_id_idx" ON "notifications"."telegram_notification_channels" USING btree ("workspace_id","chat_id");--> statement-breakpoint
CREATE POLICY "email_notification_channels_tenant_isolation" ON "notifications"."email_notification_channels" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "notification_channels_tenant_isolation" ON "notifications"."notification_channels" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "notification_deliveries_tenant_isolation" ON "notifications"."notification_deliveries" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "notification_settings_tenant_isolation" ON "notifications"."notification_settings" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "notifications_tenant_isolation" ON "notifications"."notifications" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "telegram_notification_channels_tenant_isolation" ON "notifications"."telegram_notification_channels" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "notifications"."notification_settings" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications"."notification_channels" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications"."email_notification_channels" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications"."telegram_notification_channels" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications"."notifications" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications"."notification_deliveries" FORCE ROW LEVEL SECURITY;
