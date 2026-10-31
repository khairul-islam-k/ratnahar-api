CREATE TABLE "payment_gateways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "payment_gateways_slug_uidx" ON "payment_gateways" USING btree ("slug");