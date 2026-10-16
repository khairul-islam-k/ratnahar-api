ALTER TABLE "system_users" ADD COLUMN "photo" varchar(2048);--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "photo";