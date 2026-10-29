ALTER TABLE "conversations"."conversations" ADD COLUMN "last_customer_message_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations"."conversations" ADD COLUMN "last_escalated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations"."conversations" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversations"."messages" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
UPDATE "conversations"."conversations" c SET "last_customer_message_at" = (SELECT max(m."created_at") FROM "conversations"."messages" m WHERE m."workspace_id" = c."workspace_id" AND m."conversation_id" = c."id" AND m."author" = 'customer');--> statement-breakpoint
UPDATE "conversations"."conversations" c SET "last_escalated_at" = c."last_message_at" WHERE c."state" IN ('waiting', 'handled') OR EXISTS (SELECT 1 FROM "conversations"."messages" m WHERE m."workspace_id" = c."workspace_id" AND m."conversation_id" = c."id" AND m."author" = 'operator');--> statement-breakpoint
ALTER TABLE "conversations"."conversations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversations"."messages" FORCE ROW LEVEL SECURITY;
