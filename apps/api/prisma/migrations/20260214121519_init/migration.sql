/*
  Warnings:

  - The values [arrays_hashing,two_pointers,sliding_window,binary_search,linked_list,priority_queue,one_d_dp,two_d_dp] on the enum `ProblemTopic` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProblemTopic_new" AS ENUM ('arrays-hashing', 'two-pointers', 'sliding-window', 'stack', 'binary-search', 'linked-list', 'tree', 'priority-queue', 'backtracking', 'tries', 'graphs', '1d-dp', '2d-dp');
ALTER TABLE "problem" ALTER COLUMN "topics" TYPE "ProblemTopic_new" USING ("topics"::text::"ProblemTopic_new");
ALTER TYPE "ProblemTopic" RENAME TO "ProblemTopic_old";
ALTER TYPE "ProblemTopic_new" RENAME TO "ProblemTopic";
DROP TYPE "public"."ProblemTopic_old";
COMMIT;
