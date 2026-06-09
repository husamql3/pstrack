-- CreateEnum
CREATE TYPE "Roadmap" AS ENUM ('NC250', 'NC150', 'BLIND75');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN "roadmap" "Roadmap" NOT NULL DEFAULT 'NC250';
