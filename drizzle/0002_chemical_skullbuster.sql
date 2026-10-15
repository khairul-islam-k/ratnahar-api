CREATE TYPE "public"."ShopStatus" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"logo" varchar(2048),
	"email" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"address" varchar(500) NOT NULL,
	"district" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"country" varchar(100) NOT NULL,
	"website_id" uuid,
	"default_currency" varchar(3) NOT NULL,
	"status" "ShopStatus" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_tenant_id_system_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."system_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shops_tenant_name_uidx" ON "shops" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "shops_tenant_status_idx" ON "shops" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "shops_tenant_created_at_idx" ON "shops" USING btree ("tenant_id","created_at");