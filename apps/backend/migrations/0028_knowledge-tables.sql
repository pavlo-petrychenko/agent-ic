CREATE SCHEMA "knowledge";
--> statement-breakpoint
CREATE TYPE "knowledge"."knowledge_connection_provider" AS ENUM('google_docs');--> statement-breakpoint
CREATE TYPE "knowledge"."knowledge_connection_status" AS ENUM('active', 'revoked', 'error');--> statement-breakpoint
CREATE TYPE "knowledge"."knowledge_document_status" AS ENUM('pending', 'indexing', 'indexed', 'error', 'removed');--> statement-breakpoint
CREATE TYPE "knowledge"."knowledge_source_kind" AS ENUM('upload', 'google_docs');--> statement-breakpoint
CREATE TYPE "knowledge"."knowledge_source_status" AS ENUM('pending', 'indexing', 'ready', 'error');--> statement-breakpoint
CREATE TYPE "knowledge"."knowledge_summary_source" AS ENUM('auto', 'user');--> statement-breakpoint
CREATE TYPE "knowledge"."knowledge_sync_interval" AS ENUM('hourly', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "knowledge"."knowledge_sync_status" AS ENUM('queued', 'running', 'succeeded', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "knowledge"."knowledge_sync_trigger" AS ENUM('initial', 'manual', 'scheduled');--> statement-breakpoint
CREATE TABLE "knowledge"."chunk_terms" (
	"workspace_id" uuid NOT NULL,
	"kb_id" uuid NOT NULL,
	"chunk_id" uuid NOT NULL,
	"term" text NOT NULL,
	"frequency" integer NOT NULL,
	CONSTRAINT "chunk_terms_chunk_id_term_key" PRIMARY KEY("chunk_id","term"),
	CONSTRAINT "chunk_terms_frequency_positive" CHECK ("knowledge"."chunk_terms"."frequency" >= 1)
);
--> statement-breakpoint
ALTER TABLE "knowledge"."chunk_terms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."chunk_terms" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge"."chunks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kb_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"generation" integer NOT NULL,
	"ordinal" integer NOT NULL,
	"content" text NOT NULL,
	"index_text" text NOT NULL,
	"content_hash" text NOT NULL,
	"token_count" integer NOT NULL,
	"embedding" halfvec(1024) NOT NULL,
	"embedding_model" text NOT NULL,
	"embedding_dimensions" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "chunks_workspace_id_id_key" UNIQUE("workspace_id","id"),
	CONSTRAINT "chunks_document_id_generation_ordinal_key" UNIQUE("document_id","generation","ordinal"),
	CONSTRAINT "chunks_generation_nonnegative" CHECK ("knowledge"."chunks"."generation" >= 0),
	CONSTRAINT "chunks_ordinal_nonnegative" CHECK ("knowledge"."chunks"."ordinal" >= 0),
	CONSTRAINT "chunks_token_count_nonnegative" CHECK ("knowledge"."chunks"."token_count" >= 0),
	CONSTRAINT "chunks_embedding_dimensions_positive" CHECK ("knowledge"."chunks"."embedding_dimensions" >= 1)
);
--> statement-breakpoint
ALTER TABLE "knowledge"."chunks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."chunks" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge"."connections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"provider" "knowledge"."knowledge_connection_provider" NOT NULL,
	"account_email" text NOT NULL,
	"account_subject" text NOT NULL,
	"sealed_refresh_token" text NOT NULL,
	"scopes" text[],
	"status" "knowledge"."knowledge_connection_status" NOT NULL,
	"last_error_code" text,
	"last_error_message" text,
	"last_used_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "connections_workspace_id_id_key" UNIQUE("workspace_id","id"),
	CONSTRAINT "connections_workspace_id_provider_account_subject_key" UNIQUE("workspace_id","provider","account_subject")
);
--> statement-breakpoint
ALTER TABLE "knowledge"."connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."connections" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge"."documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kb_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"external_id" text,
	"external_resource_key" text,
	"provider_version" text,
	"provider_modified_at" timestamp with time zone,
	"title" text NOT NULL,
	"mime_type" text NOT NULL,
	"source_url" text,
	"size_bytes" bigint,
	"original_storage_key" text,
	"content_storage_key" text,
	"content_hash" text,
	"summary" text,
	"summary_source" "knowledge"."knowledge_summary_source",
	"summary_updated_at" timestamp with time zone,
	"token_count" integer DEFAULT 0 NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"status" "knowledge"."knowledge_document_status" NOT NULL,
	"active_generation" integer DEFAULT 0 NOT NULL,
	"last_indexed_at" timestamp with time zone,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "documents_workspace_id_id_key" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
ALTER TABLE "knowledge"."documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."documents" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge"."embedding_cache" (
	"workspace_id" uuid NOT NULL,
	"model" text NOT NULL,
	"dimensions" integer NOT NULL,
	"text_hash" text NOT NULL,
	"embedding" halfvec(1024) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone NOT NULL,
	CONSTRAINT "embedding_cache_workspace_id_model_dimensions_text_hash_key" PRIMARY KEY("workspace_id","model","dimensions","text_hash"),
	CONSTRAINT "embedding_cache_dimensions_positive" CHECK ("knowledge"."embedding_cache"."dimensions" >= 1)
);
--> statement-breakpoint
ALTER TABLE "knowledge"."embedding_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."embedding_cache" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge"."knowledge_bases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tool_name" text NOT NULL,
	"tool_description" text,
	"embedding_model" text NOT NULL,
	"embedding_dimensions" integer NOT NULL,
	"document_count" integer DEFAULT 0 NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "knowledge_bases_workspace_id_id_key" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
ALTER TABLE "knowledge"."knowledge_bases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."knowledge_bases" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge"."sections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kb_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"generation" integer NOT NULL,
	"ordinal" integer NOT NULL,
	"level" smallint NOT NULL,
	"path" text NOT NULL,
	"heading" text,
	"token_count" integer NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sections_workspace_id_id_key" UNIQUE("workspace_id","id"),
	CONSTRAINT "sections_document_id_generation_ordinal_key" UNIQUE("document_id","generation","ordinal"),
	CONSTRAINT "sections_level_range" CHECK ("knowledge"."sections"."level" between 1 and 6),
	CONSTRAINT "sections_generation_nonnegative" CHECK ("knowledge"."sections"."generation" >= 0),
	CONSTRAINT "sections_ordinal_nonnegative" CHECK ("knowledge"."sections"."ordinal" >= 0),
	CONSTRAINT "sections_token_count_nonnegative" CHECK ("knowledge"."sections"."token_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "knowledge"."sections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."sections" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge"."sources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kb_id" uuid NOT NULL,
	"connection_id" uuid,
	"kind" "knowledge"."knowledge_source_kind" NOT NULL,
	"title" text NOT NULL,
	"status" "knowledge"."knowledge_source_status" NOT NULL,
	"sync_interval" "knowledge"."knowledge_sync_interval",
	"sync_time" time,
	"sync_weekday" smallint,
	"timezone" text,
	"next_sync_at" timestamp with time zone,
	"last_sync_at" timestamp with time zone,
	"last_error_code" text,
	"last_error_message" text,
	"document_count" integer DEFAULT 0 NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "sources_workspace_id_id_key" UNIQUE("workspace_id","id"),
	CONSTRAINT "sources_upload_has_no_connection_or_schedule" CHECK ("knowledge"."sources"."kind" <> 'upload' OR ("knowledge"."sources"."connection_id" is null and "knowledge"."sources"."sync_interval" is null)),
	CONSTRAINT "sources_google_has_connection" CHECK ("knowledge"."sources"."kind" <> 'google_docs' OR "knowledge"."sources"."connection_id" is not null),
	CONSTRAINT "sources_schedule_fields" CHECK (("knowledge"."sources"."sync_interval" is null and "knowledge"."sources"."sync_time" is null and "knowledge"."sources"."sync_weekday" is null and "knowledge"."sources"."timezone" is null and "knowledge"."sources"."next_sync_at" is null) OR ("knowledge"."sources"."sync_interval" is not null and "knowledge"."sources"."next_sync_at" is not null and "knowledge"."sources"."timezone" is not null)),
	CONSTRAINT "sources_weekly_has_time" CHECK ("knowledge"."sources"."sync_interval" is distinct from 'weekly' OR ("knowledge"."sources"."sync_weekday" between 1 and 7 and "knowledge"."sources"."sync_time" is not null)),
	CONSTRAINT "sources_daily_has_time" CHECK ("knowledge"."sources"."sync_interval" is distinct from 'daily' OR "knowledge"."sources"."sync_time" is not null)
);
--> statement-breakpoint
ALTER TABLE "knowledge"."sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."sources" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge"."sync_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"trigger" "knowledge"."knowledge_sync_trigger" NOT NULL,
	"status" "knowledge"."knowledge_sync_status" NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"documents_total" integer DEFAULT 0 NOT NULL,
	"documents_indexed" integer DEFAULT 0 NOT NULL,
	"documents_skipped" integer DEFAULT 0 NOT NULL,
	"documents_failed" integer DEFAULT 0 NOT NULL,
	"documents_removed" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sync_runs_workspace_id_id_key" UNIQUE("workspace_id","id"),
	CONSTRAINT "sync_runs_documents_total_nonnegative" CHECK ("knowledge"."sync_runs"."documents_total" >= 0),
	CONSTRAINT "sync_runs_documents_indexed_nonnegative" CHECK ("knowledge"."sync_runs"."documents_indexed" >= 0),
	CONSTRAINT "sync_runs_documents_skipped_nonnegative" CHECK ("knowledge"."sync_runs"."documents_skipped" >= 0),
	CONSTRAINT "sync_runs_documents_failed_nonnegative" CHECK ("knowledge"."sync_runs"."documents_failed" >= 0),
	CONSTRAINT "sync_runs_documents_removed_nonnegative" CHECK ("knowledge"."sync_runs"."documents_removed" >= 0)
);
--> statement-breakpoint
ALTER TABLE "knowledge"."sync_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."sync_runs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge"."chunk_terms" ADD CONSTRAINT "chunk_terms_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."chunk_terms" ADD CONSTRAINT "chunk_terms_workspace_id_chunk_id_chunks_fk" FOREIGN KEY ("workspace_id","chunk_id") REFERENCES "knowledge"."chunks"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."chunk_terms" ADD CONSTRAINT "chunk_terms_workspace_id_kb_id_knowledge_bases_fk" FOREIGN KEY ("workspace_id","kb_id") REFERENCES "knowledge"."knowledge_bases"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."chunks" ADD CONSTRAINT "chunks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."chunks" ADD CONSTRAINT "chunks_workspace_id_document_id_documents_fk" FOREIGN KEY ("workspace_id","document_id") REFERENCES "knowledge"."documents"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."chunks" ADD CONSTRAINT "chunks_workspace_id_section_id_sections_fk" FOREIGN KEY ("workspace_id","section_id") REFERENCES "knowledge"."sections"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."chunks" ADD CONSTRAINT "chunks_workspace_id_kb_id_knowledge_bases_fk" FOREIGN KEY ("workspace_id","kb_id") REFERENCES "knowledge"."knowledge_bases"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."connections" ADD CONSTRAINT "connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."connections" ADD CONSTRAINT "connections_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."documents" ADD CONSTRAINT "documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."documents" ADD CONSTRAINT "documents_workspace_id_kb_id_knowledge_bases_fk" FOREIGN KEY ("workspace_id","kb_id") REFERENCES "knowledge"."knowledge_bases"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."documents" ADD CONSTRAINT "documents_workspace_id_source_id_sources_fk" FOREIGN KEY ("workspace_id","source_id") REFERENCES "knowledge"."sources"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."embedding_cache" ADD CONSTRAINT "embedding_cache_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."knowledge_bases" ADD CONSTRAINT "knowledge_bases_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."knowledge_bases" ADD CONSTRAINT "knowledge_bases_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."sections" ADD CONSTRAINT "sections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."sections" ADD CONSTRAINT "sections_workspace_id_document_id_documents_fk" FOREIGN KEY ("workspace_id","document_id") REFERENCES "knowledge"."documents"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."sections" ADD CONSTRAINT "sections_workspace_id_kb_id_knowledge_bases_fk" FOREIGN KEY ("workspace_id","kb_id") REFERENCES "knowledge"."knowledge_bases"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."sources" ADD CONSTRAINT "sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."sources" ADD CONSTRAINT "sources_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."sources" ADD CONSTRAINT "sources_workspace_id_kb_id_knowledge_bases_fk" FOREIGN KEY ("workspace_id","kb_id") REFERENCES "knowledge"."knowledge_bases"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."sources" ADD CONSTRAINT "sources_workspace_id_connection_id_connections_fk" FOREIGN KEY ("workspace_id","connection_id") REFERENCES "knowledge"."connections"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."sync_runs" ADD CONSTRAINT "sync_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge"."sync_runs" ADD CONSTRAINT "sync_runs_workspace_id_source_id_sources_fk" FOREIGN KEY ("workspace_id","source_id") REFERENCES "knowledge"."sources"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chunk_terms_workspace_id_chunk_id_idx" ON "knowledge"."chunk_terms" USING btree ("workspace_id","chunk_id");--> statement-breakpoint
CREATE INDEX "chunk_terms_workspace_id_kb_id_term_idx" ON "knowledge"."chunk_terms" USING btree ("workspace_id","kb_id","term");--> statement-breakpoint
CREATE INDEX "chunks_workspace_id_document_id_idx" ON "knowledge"."chunks" USING btree ("workspace_id","document_id");--> statement-breakpoint
CREATE INDEX "chunks_workspace_id_section_id_idx" ON "knowledge"."chunks" USING btree ("workspace_id","section_id");--> statement-breakpoint
CREATE INDEX "chunks_workspace_id_kb_id_generation_idx" ON "knowledge"."chunks" USING btree ("workspace_id","kb_id","generation");--> statement-breakpoint
CREATE INDEX "chunks_section_id_ordinal_idx" ON "knowledge"."chunks" USING btree ("section_id","ordinal");--> statement-breakpoint
CREATE INDEX "chunks_workspace_id_kb_id_content_hash_idx" ON "knowledge"."chunks" USING btree ("workspace_id","kb_id","content_hash");--> statement-breakpoint
CREATE INDEX "connections_workspace_id_status_idx" ON "knowledge"."connections" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "connections_created_by_user_id_idx" ON "knowledge"."connections" USING btree ("created_by_user_id") WHERE "knowledge"."connections"."created_by_user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "documents_workspace_id_source_id_external_id_key" ON "knowledge"."documents" USING btree ("workspace_id","source_id","external_id") WHERE "knowledge"."documents"."external_id" is not null and "knowledge"."documents"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "documents_workspace_id_source_id_upload_key" ON "knowledge"."documents" USING btree ("workspace_id","source_id") WHERE "knowledge"."documents"."external_id" is null and "knowledge"."documents"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "documents_workspace_id_kb_id_status_idx" ON "knowledge"."documents" USING btree ("workspace_id","kb_id","status");--> statement-breakpoint
CREATE INDEX "documents_workspace_id_source_id_idx" ON "knowledge"."documents" USING btree ("workspace_id","source_id");--> statement-breakpoint
CREATE INDEX "documents_title_trgm_idx" ON "knowledge"."documents" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_bases_workspace_id_lower_name_key" ON "knowledge"."knowledge_bases" USING btree ("workspace_id",lower("name")) WHERE "knowledge"."knowledge_bases"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_bases_workspace_id_lower_tool_name_key" ON "knowledge"."knowledge_bases" USING btree ("workspace_id",lower("tool_name")) WHERE "knowledge"."knowledge_bases"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "knowledge_bases_created_by_user_id_idx" ON "knowledge"."knowledge_bases" USING btree ("created_by_user_id") WHERE "knowledge"."knowledge_bases"."created_by_user_id" is not null;--> statement-breakpoint
CREATE INDEX "sections_workspace_id_document_id_idx" ON "knowledge"."sections" USING btree ("workspace_id","document_id");--> statement-breakpoint
CREATE INDEX "sections_workspace_id_kb_id_idx" ON "knowledge"."sections" USING btree ("workspace_id","kb_id");--> statement-breakpoint
CREATE INDEX "sources_workspace_id_kb_id_idx" ON "knowledge"."sources" USING btree ("workspace_id","kb_id");--> statement-breakpoint
CREATE INDEX "sources_workspace_id_connection_id_idx" ON "knowledge"."sources" USING btree ("workspace_id","connection_id") WHERE "knowledge"."sources"."connection_id" is not null;--> statement-breakpoint
CREATE INDEX "sources_workspace_id_next_sync_at_idx" ON "knowledge"."sources" USING btree ("workspace_id","next_sync_at") WHERE "knowledge"."sources"."deleted_at" is null and "knowledge"."sources"."sync_interval" is not null;--> statement-breakpoint
CREATE INDEX "sources_created_by_user_id_idx" ON "knowledge"."sources" USING btree ("created_by_user_id") WHERE "knowledge"."sources"."created_by_user_id" is not null;--> statement-breakpoint
CREATE INDEX "sync_runs_workspace_id_source_id_idx" ON "knowledge"."sync_runs" USING btree ("workspace_id","source_id");--> statement-breakpoint
CREATE INDEX "sync_runs_source_id_created_at_idx" ON "knowledge"."sync_runs" USING btree ("source_id","created_at");--> statement-breakpoint
CREATE POLICY "chunk_terms_tenant_isolation" ON "knowledge"."chunk_terms" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "chunks_tenant_isolation" ON "knowledge"."chunks" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "connections_tenant_isolation" ON "knowledge"."connections" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "documents_tenant_isolation" ON "knowledge"."documents" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "embedding_cache_tenant_isolation" ON "knowledge"."embedding_cache" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "knowledge_bases_tenant_isolation" ON "knowledge"."knowledge_bases" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "sections_tenant_isolation" ON "knowledge"."sections" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "sources_tenant_isolation" ON "knowledge"."sources" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "sync_runs_tenant_isolation" ON "knowledge"."sync_runs" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);