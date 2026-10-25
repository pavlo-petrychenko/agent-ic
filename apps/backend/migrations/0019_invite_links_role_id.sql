ALTER TABLE "identity"."invite_links" ADD COLUMN "role_id" uuid;--> statement-breakpoint
ALTER TABLE "identity"."invite_links" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."roles" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
UPDATE "identity"."invite_links" i
SET "role_id" = r."id"
FROM "identity"."roles" r
WHERE r."workspace_id" = i."workspace_id" AND r."key" = i."role" AND r."is_system";--> statement-breakpoint
ALTER TABLE "identity"."invite_links" ALTER COLUMN "role_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "identity"."invite_links" ADD CONSTRAINT "invite_links_workspace_id_role_id_roles_workspace_id_id_fk" FOREIGN KEY ("workspace_id","role_id") REFERENCES "identity"."roles"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."invite_links" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "identity"."invite_links" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."roles" FORCE ROW LEVEL SECURITY;
