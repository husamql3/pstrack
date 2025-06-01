/*
  Warnings:

  - You are about to drop the column `tab` on the `resources` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `resources` table. All the data in the column will be lost.
  - Added the required column `tab_id` to the `resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_id` to the `resources` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "resources" DROP COLUMN "tab",
DROP COLUMN "type",
ADD COLUMN     "tab_id" INTEGER NOT NULL,
ADD COLUMN     "type_id" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "ResourceTab";

-- DropEnum
DROP TYPE "ResourceType";

-- CreateTable
CREATE TABLE "resource_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "resource_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_tabs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "resource_tabs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_types_name_key" ON "resource_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "resource_tabs_name_key" ON "resource_tabs"("name");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "resource_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_tab_id_fkey" FOREIGN KEY ("tab_id") REFERENCES "resource_tabs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
