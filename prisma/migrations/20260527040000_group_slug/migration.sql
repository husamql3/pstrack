-- Add slug column to Group (nullable first so existing rows don't fail)
ALTER TABLE "Group" ADD COLUMN "slug" TEXT;

-- Backfill existing rows with a unique slug derived from the id
UPDATE "Group" SET "slug" = LOWER(SUBSTRING("id", 1, 12)) WHERE "slug" IS NULL;

-- Make non-nullable and add unique index
ALTER TABLE "Group" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");
