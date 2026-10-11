CREATE SCHEMA "prompts";
--> statement-breakpoint
CREATE TABLE "prompts"."prompt_folders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "prompts"."prompt_folders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prompts"."prompt_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"text" text NOT NULL,
	"note" text,
	"author_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "prompt_versions_number_positive" CHECK ("prompts"."prompt_versions"."number" >= 1),
	CONSTRAINT "prompt_versions_text_max_length" CHECK (char_length("prompts"."prompt_versions"."text") <= 8000)
);
--> statement-breakpoint
ALTER TABLE "prompts"."prompt_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "prompts"."prompts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"folder_id" uuid,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "prompts_workspace_id_id_key" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
ALTER TABLE "prompts"."prompts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prompts"."prompt_versions" ADD CONSTRAINT "prompt_versions_workspace_id_prompt_id_prompts_fk" FOREIGN KEY ("workspace_id","prompt_id") REFERENCES "prompts"."prompts"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts"."prompts" ADD CONSTRAINT "prompts_folder_id_prompt_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "prompts"."prompt_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_folders_workspace_id_lower_name_key" ON "prompts"."prompt_folders" USING btree ("workspace_id",lower("name")) WHERE "prompts"."prompt_folders"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "prompt_folders_workspace_id_name_idx" ON "prompts"."prompt_folders" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_versions_prompt_id_number_key" ON "prompts"."prompt_versions" USING btree ("prompt_id","number");--> statement-breakpoint
CREATE INDEX "prompt_versions_workspace_id_prompt_id_number_idx" ON "prompts"."prompt_versions" USING btree ("workspace_id","prompt_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "prompts_workspace_id_lower_name_key" ON "prompts"."prompts" USING btree ("workspace_id",lower("name")) WHERE "prompts"."prompts"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "prompts_workspace_id_folder_id_idx" ON "prompts"."prompts" USING btree ("workspace_id","folder_id");--> statement-breakpoint
CREATE POLICY "prompt_folders_tenant_isolation" ON "prompts"."prompt_folders" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "prompt_versions_tenant_isolation" ON "prompts"."prompt_versions" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "prompts_tenant_isolation" ON "prompts"."prompts" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "prompts"."prompt_folders" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prompts"."prompt_versions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prompts"."prompts" FORCE ROW LEVEL SECURITY;