/*
  Warnings:

  - The `status` column on the `leetcoders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[username]` on the table `leetcoders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LeetcodeStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "leetcoders" DROP COLUMN "status",
ADD COLUMN     "status" "LeetcodeStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "leetcoders_username_key" ON "leetcoders"("username");
