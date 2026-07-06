-- Create roadmap catalog + ordered membership tables. The existing enum and
-- boolean problem flags remain as compatibility scaffolding for this migration.

CREATE TABLE "RoadmapCatalog" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'NEETCODE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RoadmapCatalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoadmapProblem" (
  "roadmapId" TEXT NOT NULL,
  "problemId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "topic" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RoadmapProblem_pkey" PRIMARY KEY ("roadmapId", "problemId")
);

CREATE UNIQUE INDEX "RoadmapCatalog_key_key" ON "RoadmapCatalog"("key");
CREATE UNIQUE INDEX "RoadmapCatalog_slug_key" ON "RoadmapCatalog"("slug");
CREATE INDEX "RoadmapCatalog_isActive_sortOrder_idx" ON "RoadmapCatalog"("isActive", "sortOrder");
CREATE UNIQUE INDEX "RoadmapProblem_roadmapId_position_key" ON "RoadmapProblem"("roadmapId", "position");
CREATE INDEX "RoadmapProblem_problemId_idx" ON "RoadmapProblem"("problemId");

ALTER TABLE "RoadmapProblem"
  ADD CONSTRAINT "RoadmapProblem_roadmapId_fkey"
  FOREIGN KEY ("roadmapId") REFERENCES "RoadmapCatalog"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoadmapProblem"
  ADD CONSTRAINT "RoadmapProblem_problemId_fkey"
  FOREIGN KEY ("problemId") REFERENCES "Problem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "RoadmapCatalog" ("id", "key", "slug", "title", "description", "source", "sortOrder", "updatedAt")
VALUES
  ('roadmap_nc250', 'NC250', 'neetcode-250', 'NeetCode 250', 'Full 250-problem roadmap', 'NEETCODE', 10, CURRENT_TIMESTAMP),
  ('roadmap_nc150', 'NC150', 'neetcode-150', 'NeetCode 150', 'Core 150 problems', 'NEETCODE', 20, CURRENT_TIMESTAMP),
  ('roadmap_blind75', 'BLIND75', 'blind-75', 'Blind 75', 'Classic 75 problems', 'NEETCODE', 30, CURRENT_TIMESTAMP);

ALTER TABLE "Group" ALTER COLUMN "roadmap" DROP DEFAULT;
ALTER TABLE "Group" ALTER COLUMN "roadmap" TYPE TEXT USING "roadmap"::text;
ALTER TABLE "Group" ALTER COLUMN "roadmap" SET DEFAULT 'NC250';
CREATE INDEX "Group_roadmap_idx" ON "Group"("roadmap");

ALTER TABLE "Group"
  ADD CONSTRAINT "Group_roadmap_fkey"
  FOREIGN KEY ("roadmap") REFERENCES "RoadmapCatalog"("key")
  ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "RoadmapProblem" ("roadmapId", "problemId", "position", "topic", "updatedAt")
SELECT 'roadmap_nc250', id, ROW_NUMBER() OVER (ORDER BY "roadmapIndex"), topic, CURRENT_TIMESTAMP
FROM "Problem"
WHERE "neetcode250" = true
ORDER BY "roadmapIndex";

INSERT INTO "RoadmapProblem" ("roadmapId", "problemId", "position", "topic", "updatedAt")
SELECT 'roadmap_nc150', id, ROW_NUMBER() OVER (ORDER BY "roadmapIndex"), topic, CURRENT_TIMESTAMP
FROM "Problem"
WHERE "neetcode150" = true
ORDER BY "roadmapIndex";

INSERT INTO "RoadmapProblem" ("roadmapId", "problemId", "position", "topic", "updatedAt")
SELECT 'roadmap_blind75', id, ROW_NUMBER() OVER (ORDER BY "roadmapIndex"), topic, CURRENT_TIMESTAMP
FROM "Problem"
WHERE "blind75" = true
ORDER BY "roadmapIndex";

UPDATE "Group" AS g
SET "roadmapIndex" = COALESCE((
  SELECT COUNT(*)
  FROM "RoadmapProblem" rp
  JOIN "RoadmapCatalog" rc ON rc.id = rp."roadmapId"
  JOIN "Problem" p ON p.id = rp."problemId"
  WHERE rc.key = g.roadmap
    AND p."roadmapIndex" <= g."roadmapIndex"
), 0);
