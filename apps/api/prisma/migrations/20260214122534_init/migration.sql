/*
  Warnings:

  - Made the column `roadmap_index` on table `problem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "problem" ALTER COLUMN "roadmap_index" SET NOT NULL;
