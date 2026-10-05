CREATE SCHEMA "outbox";
--> statement-breakpoint
CREATE TABLE "outbox"."messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"queue" text NOT NULL,
	"name" text NOT NULL,
	"envelope" jsonb NOT NULL,
	"workspace_id" uuid,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "outbox"."messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "outbox"."messages" USING btree ("created_at");--> statement-breakpoint
CREATE POLICY "messages_app_insert" ON "outbox"."messages" AS PERMISSIVE FOR INSERT TO "app" WITH CHECK (true);--> statement-breakpoint
ALTER TABLE "outbox"."messages" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE SELECT, UPDATE, DELETE ON "outbox"."messages" FROM app;