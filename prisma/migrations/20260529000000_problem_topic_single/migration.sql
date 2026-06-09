-- Replace Problem.topics (String[]) with Problem.topic (String) - single primary topic.

ALTER TABLE "Problem" ADD COLUMN "topic" TEXT;

UPDATE "Problem" SET "topic" = COALESCE("topics"[1], 'Other');

ALTER TABLE "Problem" ALTER COLUMN "topic" SET NOT NULL;

ALTER TABLE "Problem" DROP COLUMN "topics";
