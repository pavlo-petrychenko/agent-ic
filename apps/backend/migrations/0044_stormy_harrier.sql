ALTER TABLE "knowledge"."documents" ADD COLUMN "stale_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "knowledge"."documents" ADD COLUMN "stale_reason" text;--> statement-breakpoint
ALTER TABLE "knowledge"."sources" ADD COLUMN "stale_document_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge"."sync_runs" ADD COLUMN "documents_stale" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge"."sync_runs" ADD CONSTRAINT "sync_runs_documents_stale_nonnegative" CHECK ("knowledge"."sync_runs"."documents_stale" >= 0);