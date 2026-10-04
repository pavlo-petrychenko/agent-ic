CREATE SCHEMA "identity";
--> statement-breakpoint
CREATE TYPE "identity"."email_token_purpose" AS ENUM('email_confirmation', 'password_reset');--> statement-breakpoint
CREATE TYPE "identity"."locale" AS ENUM('en', 'uk');--> statement-breakpoint
CREATE TABLE "identity"."email_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" "identity"."email_token_purpose" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity"."sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"replaced_by_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"locale" "identity"."locale" NOT NULL,
	"email_confirmed_at" timestamp with time zone,
	"pending_invite_link_id" uuid,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "identity"."email_tokens" ADD CONSTRAINT "email_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."sessions" ADD CONSTRAINT "sessions_replaced_by_id_sessions_id_fk" FOREIGN KEY ("replaced_by_id") REFERENCES "identity"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_tokens_token_hash_key" ON "identity"."email_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "email_tokens_user_id_idx" ON "identity"."email_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "identity"."sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_family_id_idx" ON "identity"."sessions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "identity"."sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "identity"."users" USING btree ("email");