ALTER TABLE "identity"."memberships" ADD COLUMN "role_id" uuid;--> statement-breakpoint
ALTER TABLE "identity"."roles" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."role_permissions" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."memberships" NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
INSERT INTO "identity"."roles" ("id","workspace_id","key","name","is_system","created_at","updated_at")
SELECT gen_random_uuid(), w."id", k."key"::"identity"."workspace_role", NULL, true, now(), now()
FROM "identity"."workspaces" w
CROSS JOIN (VALUES ('owner'), ('admin'), ('builder'), ('operator')) AS k("key")
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "identity"."role_permissions" ("id","workspace_id","role_id","resource","action")
SELECT gen_random_uuid(), r."workspace_id", r."id", m."resource"::"identity"."permission_resource", a."action"::"identity"."permission_action"
FROM "identity"."roles" r
JOIN (VALUES
	('owner', 'agents', ARRAY['view', 'edit', 'delete', 'publish']),
	('owner', 'prompts', ARRAY['view', 'edit', 'delete']),
	('owner', 'knowledge_bases', ARRAY['view', 'edit', 'delete']),
	('owner', 'channels', ARRAY['view', 'edit', 'delete']),
	('owner', 'inbox', ARRAY['view', 'edit', 'delete']),
	('owner', 'testing', ARRAY['view', 'edit', 'delete']),
	('owner', 'analytics', ARRAY['view', 'edit', 'delete']),
	('owner', 'team', ARRAY['view', 'edit', 'delete']),
	('owner', 'workspace_settings', ARRAY['view', 'edit', 'delete', 'transfer']),
	('admin', 'agents', ARRAY['view', 'edit', 'delete', 'publish']),
	('admin', 'prompts', ARRAY['view', 'edit', 'delete']),
	('admin', 'knowledge_bases', ARRAY['view', 'edit', 'delete']),
	('admin', 'channels', ARRAY['view', 'edit', 'delete']),
	('admin', 'inbox', ARRAY['view', 'edit', 'delete']),
	('admin', 'testing', ARRAY['view', 'edit', 'delete']),
	('admin', 'analytics', ARRAY['view', 'edit', 'delete']),
	('admin', 'team', ARRAY['view', 'edit', 'delete']),
	('admin', 'workspace_settings', ARRAY['view', 'edit', 'leave']),
	('builder', 'agents', ARRAY['view', 'edit', 'delete', 'publish']),
	('builder', 'prompts', ARRAY['view', 'edit', 'delete']),
	('builder', 'knowledge_bases', ARRAY['view', 'edit', 'delete']),
	('builder', 'channels', ARRAY['view', 'edit', 'delete']),
	('builder', 'testing', ARRAY['view', 'edit', 'delete']),
	('builder', 'analytics', ARRAY['view']),
	('builder', 'workspace_settings', ARRAY['leave']),
	('operator', 'inbox', ARRAY['view', 'edit']),
	('operator', 'workspace_settings', ARRAY['leave'])
) AS m("key","resource","actions") ON m."key"::"identity"."workspace_role" = r."key"
CROSS JOIN LATERAL unnest(m."actions") AS a("action")
WHERE r."is_system"
ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "identity"."memberships" m
SET "role_id" = r."id"
FROM "identity"."roles" r
WHERE r."workspace_id" = m."workspace_id" AND r."key" = m."role" AND r."is_system";--> statement-breakpoint
ALTER TABLE "identity"."memberships" ALTER COLUMN "role_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "identity"."memberships" ADD CONSTRAINT "memberships_workspace_id_role_id_roles_workspace_id_id_fk" FOREIGN KEY ("workspace_id","role_id") REFERENCES "identity"."roles"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."memberships" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "identity"."roles" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."role_permissions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."memberships" FORCE ROW LEVEL SECURITY;
