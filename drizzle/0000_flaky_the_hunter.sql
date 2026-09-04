CREATE TYPE "public"."SystemUserStatus" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."SystemUserType" AS ENUM('ADMIN', 'TENANT', 'EMPLOYEE');--> statement-breakpoint
CREATE TABLE "system_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"password_hash" text NOT NULL,
	"type" "SystemUserType" NOT NULL,
	"status" "SystemUserStatus" NOT NULL,
	"email_verified_at" timestamp (6) with time zone,
	"tenant_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (6) with time zone,
	CONSTRAINT "system_users_email_unique" UNIQUE("email"),
	CONSTRAINT "system_users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "system_users" ADD CONSTRAINT "system_users_tenant_id_system_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."system_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_users" ADD CONSTRAINT "system_users_created_by_system_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."system_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_users" ADD CONSTRAINT "system_users_updated_by_system_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."system_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_users" ADD CONSTRAINT "system_users_deleted_by_system_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."system_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "system_users_type_idx" ON "system_users" USING btree ("type");--> statement-breakpoint
CREATE INDEX "system_users_status_idx" ON "system_users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "system_users_tenant_id_idx" ON "system_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "system_users_deleted_at_idx" ON "system_users" USING btree ("deleted_at");