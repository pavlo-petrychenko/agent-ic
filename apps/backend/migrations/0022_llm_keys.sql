CREATE SCHEMA "llm_keys";
--> statement-breakpoint
CREATE TABLE "llm_keys"."llm_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"vendor" text NOT NULL,
	"name" text NOT NULL,
	"base_url" text,
	"sealed_key" text NOT NULL,
	"key_last4" text NOT NULL,
	"fallback_to_platform" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "llm_keys_workspace_id_id_key" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
ALTER TABLE "llm_keys"."llm_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "llm_keys_workspace_id_vendor_key" ON "llm_keys"."llm_keys" USING btree ("workspace_id","vendor") WHERE "llm_keys"."llm_keys"."vendor" <> 'custom';--> statement-breakpoint
CREATE UNIQUE INDEX "llm_keys_workspace_id_lower_name_key" ON "llm_keys"."llm_keys" USING btree ("workspace_id",lower("name"));--> statement-breakpoint
CREATE POLICY "llm_keys_tenant_isolation" ON "llm_keys"."llm_keys" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "llm_keys"."llm_keys" FORCE ROW LEVEL SECURITY;