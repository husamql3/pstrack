-- AlterTable
ALTER TABLE "leetcoders" ADD COLUMN     "avatar" TEXT;

-- CreateIndex
CREATE INDEX "submissions_user_id_idx" ON "submissions"("user_id");

-- CreateIndex
CREATE INDEX "submissions_problem_id_idx" ON "submissions"("problem_id");
