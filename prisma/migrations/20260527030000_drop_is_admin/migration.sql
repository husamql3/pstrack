-- Drop redundant isAdmin column — use role = 'admin' (Better Auth's native field) instead.
ALTER TABLE "user" DROP COLUMN "isAdmin";
