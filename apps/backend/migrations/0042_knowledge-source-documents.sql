CREATE TABLE "knowledge"."source_documents" (
	"workspace_id" uuid NOT NULL,
	"kb_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "source_documents_source_id_document_id_key" PRIMARY KEY("source_id","document_id")
);
--> statement-breakpoint
ALTER TABLE "knowledge"."source_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."source_documents" ADD CONSTRAINT "source_documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."source_documents" ADD CONSTRAINT "source_documents_workspace_id_source_id_sources_fk" FOREIGN KEY ("workspace_id","source_id") REFERENCES "knowledge"."sources"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."source_documents" ADD CONSTRAINT "source_documents_workspace_id_document_id_documents_fk" FOREIGN KEY ("workspace_id","document_id") REFERENCES "knowledge"."documents"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."source_documents" ADD CONSTRAINT "source_documents_workspace_id_kb_id_knowledge_bases_fk" FOREIGN KEY ("workspace_id","kb_id") REFERENCES "knowledge"."knowledge_bases"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_documents_workspace_id_source_id_idx" ON "knowledge"."source_documents" USING btree ("workspace_id","source_id");--> statement-breakpoint
CREATE INDEX "source_documents_workspace_id_document_id_idx" ON "knowledge"."source_documents" USING btree ("workspace_id","document_id");--> statement-breakpoint
CREATE INDEX "source_documents_workspace_id_kb_id_idx" ON "knowledge"."source_documents" USING btree ("workspace_id","kb_id");--> statement-breakpoint
CREATE POLICY "source_documents_tenant_isolation" ON "knowledge"."source_documents" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "knowledge"."source_documents" FORCE ROW LEVEL SECURITY;