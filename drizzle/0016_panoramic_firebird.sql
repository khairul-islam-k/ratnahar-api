CREATE TABLE "payment_gateway_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_owner" uuid NOT NULL,
	"payment_gateway_id" uuid NOT NULL,
	"gateway_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"status" "tenant_payment_gateway_config_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
DROP TABLE "tenant_payment_gateway_configs" CASCADE;--> statement-breakpoint
ALTER TABLE "payment_gateway_configs" ADD CONSTRAINT "payment_gateway_configs_config_owner_system_users_id_fk" FOREIGN KEY ("config_owner") REFERENCES "public"."system_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_gateway_configs" ADD CONSTRAINT "payment_gateway_configs_payment_gateway_id_payment_gateways_id_fk" FOREIGN KEY ("payment_gateway_id") REFERENCES "public"."payment_gateways"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_payment_gateway_configs_tenant_gateway_uidx" ON "payment_gateway_configs" USING btree ("config_owner","payment_gateway_id");--> statement-breakpoint
CREATE INDEX "tenant_payment_gateway_configs_status_idx" ON "payment_gateway_configs" USING btree ("status");