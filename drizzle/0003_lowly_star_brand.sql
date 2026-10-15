ALTER TABLE "shops" ALTER COLUMN "phone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ALTER COLUMN "address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ALTER COLUMN "district" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ALTER COLUMN "city" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ALTER COLUMN "country" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ALTER COLUMN "default_currency" SET DEFAULT 'BDT';--> statement-breakpoint
ALTER TABLE "shops" ALTER COLUMN "default_currency" DROP NOT NULL;