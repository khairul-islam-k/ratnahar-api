CREATE TYPE "public"."GalleryStatus" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"image_url" text,
	"alt_text" varchar(255),
	"status" "GalleryStatus" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gender" varchar(30),
	"photo" varchar(2048),
	"date_of_birth" date,
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"postal_code" varchar(30),
	"country" varchar(100),
	"emergency_contact" varchar(50),
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_tenant_id_system_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."system_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_system_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."system_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "galleries_tenant_status_idx" ON "galleries" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "galleries_tenant_created_at_idx" ON "galleries" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_user_id_uidx" ON "user_profiles" USING btree ("user_id");