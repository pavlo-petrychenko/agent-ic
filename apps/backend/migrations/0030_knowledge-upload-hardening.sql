ALTER TABLE "knowledge"."documents" ADD COLUMN "pending_original_storage_key" text;--> statement-breakpoint
ALTER TABLE "knowledge"."documents" ADD COLUMN "warnings" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
DO $$
BEGIN
	IF cardinality(show_trgm('ціна')) = 0 THEN
		RAISE EXCEPTION 'pg_trgm does not support the database locale';
	END IF;
END
$$;
