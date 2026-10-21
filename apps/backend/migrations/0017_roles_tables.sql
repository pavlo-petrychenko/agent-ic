CREATE TYPE "identity"."permission_action" AS ENUM('view', 'edit', 'publish', 'delete', 'transfer', 'leave');--> statement-breakpoint
CREATE TYPE "identity"."permission_resource" AS ENUM('agents', 'prompts', 'knowledge_bases', 'channels', 'inbox', 'testing', 'analytics', 'team', 'workspace_settings');--> statement-breakpoint
CREATE TABLE "identity"."role_permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"resource" "identity"."permission_resource" NOT NULL,
	"action" "identity"."permission_action" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "identity"."role_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "identity"."roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"key" "identity"."workspace_role" NOT NULL,
	"name" text,
	"is_system" boolean NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "identity"."roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_workspace_id_id_key" ON "identity"."roles" USING btree ("workspace_id","id");--> statement-breakpoint
ALTER TABLE "identity"."role_permissions" ADD CONSTRAINT "role_permissions_workspace_id_role_id_roles_workspace_id_id_fk" FOREIGN KEY ("workspace_id","role_id") REFERENCES "identity"."roles"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."roles" ADD CONSTRAINT "roles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_role_resource_action_key" ON "identity"."role_permissions" USING btree ("role_id","resource","action");--> statement-breakpoint
CREATE INDEX "role_permissions_workspace_role_idx" ON "identity"."role_permissions" USING btree ("workspace_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_workspace_system_key" ON "identity"."roles" USING btree ("workspace_id","key") WHERE "identity"."roles"."is_system" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_workspace_custom_name_key" ON "identity"."roles" USING btree ("workspace_id",lower("name")) WHERE "identity"."roles"."is_system" = false;--> statement-breakpoint
CREATE INDEX "roles_workspace_id_idx" ON "identity"."roles" USING btree ("workspace_id");--> statement-breakpoint
CREATE POLICY "role_permissions_tenant_isolation" ON "identity"."role_permissions" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "roles_tenant_isolation" ON "identity"."roles" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "identity"."roles" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."role_permissions" FORCE ROW LEVEL SECURITY;
