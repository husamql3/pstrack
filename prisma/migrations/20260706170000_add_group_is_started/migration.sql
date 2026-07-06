-- Existing groups are already running daily accountability, so the default
-- preserves their behavior while new create paths can opt out explicitly.
ALTER TABLE "Group" ADD COLUMN "isStarted" BOOLEAN NOT NULL DEFAULT true;

