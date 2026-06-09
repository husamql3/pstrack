-- Drop name and description columns from Group table
ALTER TABLE "Group" DROP COLUMN IF EXISTS "name";
ALTER TABLE "Group" DROP COLUMN IF EXISTS "description";
