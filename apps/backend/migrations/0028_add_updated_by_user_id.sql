ALTER TABLE "channels"."channels" ADD COLUMN "updated_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "channels"."channels" ADD CONSTRAINT "channels_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "channels_updated_by_user_id_idx" ON "channels"."channels" USING btree ("updated_by_user_id");--> statement-breakpoint
UPDATE "channels"."channels" SET "updated_by_user_id" = "created_by_user_id" WHERE "updated_by_user_id" IS NULL;