ALTER TYPE "runs"."run_trigger" ADD VALUE 'schedule';--> statement-breakpoint
ALTER TYPE "runs"."run_trigger" ADD VALUE 'inactivity';--> statement-breakpoint
ALTER TABLE "runs"."runs" ADD COLUMN "trigger_node_id" text;--> statement-breakpoint
ALTER TABLE "runs"."runs" ADD COLUMN "trigger_input" jsonb;--> statement-breakpoint
ALTER TABLE "runs"."runs" ADD CONSTRAINT "runs_trigger_node_only_for_trigger_runs" CHECK (("runs"."runs"."trigger" = 'message') = ("runs"."runs"."trigger_node_id" is null));--> statement-breakpoint
ALTER TABLE "runs"."runs" ADD CONSTRAINT "runs_trigger_input_only_for_trigger_runs" CHECK ("runs"."runs"."trigger_input" is null or ("runs"."runs"."trigger" <> 'message' and jsonb_typeof("runs"."runs"."trigger_input") = 'object'));