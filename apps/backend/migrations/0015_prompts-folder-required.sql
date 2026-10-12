ALTER TABLE "prompts"."prompts" DROP CONSTRAINT "prompts_folder_id_prompt_folders_id_fk";
--> statement-breakpoint
ALTER TABLE "prompts"."prompts" ALTER COLUMN "folder_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "prompts"."prompts" ADD CONSTRAINT "prompts_folder_id_prompt_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "prompts"."prompt_folders"("id") ON DELETE restrict ON UPDATE no action;