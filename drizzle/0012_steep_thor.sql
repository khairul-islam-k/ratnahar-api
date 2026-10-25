CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."package_pricing_type" AS ENUM('fixed', 'custom');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'canceled', 'expired');--> statement-breakpoint
CREATE TABLE "package_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"limit_key" varchar(100) NOT NULL,
	"limit_value" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"module_key" varchar(100) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"pricing_type" "package_pricing_type" DEFAULT 'fixed' NOT NULL,
	"monthly_price" numeric(12, 2),
	"yearly_price" numeric(12, 2),
	"description" text,
	"status" "package_status" DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"billing_cycle" "billing_cycle" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"price_snapshot" numeric(12, 2) NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "package_limits" ADD CONSTRAINT "package_limits_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_modules" ADD CONSTRAINT "package_modules_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_system_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."system_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "package_limits_package_key_uidx" ON "package_limits" USING btree ("package_id","limit_key");--> statement-breakpoint
CREATE UNIQUE INDEX "package_modules_package_module_uidx" ON "package_modules" USING btree ("package_id","module_key");--> statement-breakpoint
CREATE UNIQUE INDEX "packages_slug_uidx" ON "packages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "packages_status_sort_order_idx" ON "packages" USING btree ("status","sort_order");--> statement-breakpoint
CREATE INDEX "subscriptions_tenant_id_idx" ON "subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "subscriptions_package_id_idx" ON "subscriptions" USING btree ("package_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_end_date_idx" ON "subscriptions" USING btree ("status","end_date");