-- AlterTable
ALTER TABLE "leetcoders" ADD COLUMN     "has_second_chance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rejoined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
