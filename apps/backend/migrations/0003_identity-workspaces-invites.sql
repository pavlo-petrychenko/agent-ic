CREATE TYPE "identity"."workspace_role" AS ENUM('owner', 'admin', 'builder', 'operator');--> statement-breakpoint
CREATE TABLE "identity"."invite_links" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"role" "identity"."workspace_role" NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "identity"."invite_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "identity"."memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "identity"."workspace_role" NOT NULL,
	"invite_link_id" uuid,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "identity"."memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "identity"."workspaces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"time_zone" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "workspaces_workspace_id_is_id" CHECK ("identity"."workspaces"."workspace_id" = "identity"."workspaces"."id")
);
--> statement-breakpoint
ALTER TABLE "identity"."workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."invite_links" ADD CONSTRAINT "invite_links_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."invite_links" ADD CONSTRAINT "invite_links_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."memberships" ADD CONSTRAINT "memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "identity"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."memberships" ADD CONSTRAINT "memberships_invite_link_id_invite_links_id_fk" FOREIGN KEY ("invite_link_id") REFERENCES "identity"."invite_links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."workspaces" ADD CONSTRAINT "workspaces_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invite_links_token_hash_key" ON "identity"."invite_links" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "invite_links_active_workspace_key" ON "identity"."invite_links" USING btree ("workspace_id") WHERE "identity"."invite_links"."revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_workspace_id_user_id_key" ON "identity"."memberships" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "memberships_user_id_idx" ON "identity"."memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memberships_invite_link_id_idx" ON "identity"."memberships" USING btree ("invite_link_id");--> statement-breakpoint
CREATE POLICY "invite_links_tenant_isolation" ON "identity"."invite_links" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "memberships_tenant_isolation" ON "identity"."memberships" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "workspaces_tenant_isolation" ON "identity"."workspaces" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "identity"."workspaces" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."memberships" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."invite_links" FORCE ROW LEVEL SECURITY;
