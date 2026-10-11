CREATE TYPE "runs"."run_step_status" AS ENUM('running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "runs"."run_steps" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"node_id" text NOT NULL,
	"node_key" text NOT NULL,
	"branch_key" text NOT NULL,
	"status" "runs"."run_step_status" NOT NULL,
	"attempt" integer NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"port" text,
	"error" jsonb,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "runs"."run_steps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "runs"."run_steps" ADD CONSTRAINT "run_steps_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "runs"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "run_steps_run_id_node_id_branch_key_key" ON "runs"."run_steps" USING btree ("run_id","node_id","branch_key");--> statement-breakpoint
CREATE POLICY "run_steps_tenant_isolation" ON "runs"."run_steps" AS PERMISSIVE FOR ALL TO public USING ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) WITH CHECK ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "runs"."run_steps" FORCE ROW LEVEL SECURITY;