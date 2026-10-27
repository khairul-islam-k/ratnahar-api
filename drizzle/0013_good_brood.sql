ALTER TYPE "public"."permission_feature" ADD VALUE 'Business Management';--> statement-breakpoint
DROP INDEX "packages_status_sort_order_idx";--> statement-breakpoint
ALTER TABLE "packages" DROP COLUMN "sort_order";