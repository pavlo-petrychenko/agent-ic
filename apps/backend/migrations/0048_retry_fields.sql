ALTER TABLE "notifications"."notification_deliveries" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications"."notification_deliveries" ADD COLUMN "next_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications"."notification_deliveries" ADD COLUMN "locked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications"."notification_deliveries" ADD COLUMN "last_error" text;--> statement-breakpoint
CREATE INDEX "notification_deliveries_retry_idx" ON "notifications"."notification_deliveries" USING btree ("status","next_attempt_at");--> statement-breakpoint
UPDATE "notifications"."notification_deliveries" SET "next_attempt_at" = now() WHERE "status" = 'pending';