ALTER TYPE "identity"."email_token_purpose" ADD VALUE 'email_change';--> statement-breakpoint
ALTER TABLE "identity"."users" ADD COLUMN "pending_email" text;