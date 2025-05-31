-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('ARTICLE', 'VIDEO', 'YOUTUBE', 'FRONTEND_MASTER', 'UDEMY');

-- CreateEnum
CREATE TYPE "ResourceTab" AS ENUM ('PROBLEM_SOLVING', 'TECHNOLOGIES');

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "contributor" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT false,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "type" "ResourceType" NOT NULL,
    "tab" "ResourceTab" NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);
