ALTER TABLE "knowledge"."source_documents" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."documents" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
INSERT INTO "knowledge"."source_documents" ("workspace_id", "kb_id", "source_id", "document_id", "created_at", "updated_at")
SELECT "workspace_id", "kb_id", "source_id", "id", "created_at", "updated_at"
FROM "knowledge"."documents"
ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "knowledge"."documents" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."source_documents" FORCE ROW LEVEL SECURITY;
