ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "group" DROP COLUMN "banned";--> statement-breakpoint
ALTER TABLE "group" DROP COLUMN "ban_reason";--> statement-breakpoint
ALTER TABLE "group" DROP COLUMN "ban_expires";