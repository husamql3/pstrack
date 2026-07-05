ALTER TABLE "Problem" ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Problem"
SET "isPremium" = true
WHERE "slug" IN (
  'encode-and-decode-strings',
  'walls-and-gates',
  'graph-valid-tree',
  'number-of-connected-components-in-an-undirected-graph',
  'alien-dictionary',
  'meeting-rooms',
  'meeting-rooms-ii'
);
