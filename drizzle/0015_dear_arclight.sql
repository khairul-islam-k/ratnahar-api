CREATE TYPE "public"."tenant_payment_gateway_config_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "tenant_payment_gateway_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_gateway_id" uuid NOT NULL,
	"gateway_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"status" "tenant_payment_gateway_config_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_payment_gateway_configs" ADD CONSTRAINT "tenant_payment_gateway_configs_tenant_id_system_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."system_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_payment_gateway_configs" ADD CONSTRAINT "tenant_payment_gateway_configs_payment_gateway_id_payment_gateways_id_fk" FOREIGN KEY ("payment_gateway_id") REFERENCES "public"."payment_gateways"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_payment_gateway_configs_tenant_gateway_uidx" ON "tenant_payment_gateway_configs" USING btree ("tenant_id","payment_gateway_id");--> statement-breakpoint
CREATE INDEX "tenant_payment_gateway_configs_status_idx" ON "tenant_payment_gateway_configs" USING btree ("status");