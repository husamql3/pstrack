-- Track when the user last changed their username (30-day cooldown enforcement)
ALTER TABLE "user" ADD COLUMN "usernameChangedAt" TIMESTAMP(3);
