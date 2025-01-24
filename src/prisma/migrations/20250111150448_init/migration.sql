-- CreateTable
CREATE TABLE "group_progress" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "group_no" INTEGER NOT NULL,
    "current_problem" INTEGER NOT NULL,

    CONSTRAINT "group_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "group_no" SERIAL NOT NULL,
    "group_name" TEXT NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leetcoders" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gh_username" TEXT,
    "lc_username" TEXT NOT NULL,
    "group_no" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "leetcoders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "problem_no" INTEGER NOT NULL,
    "problem_order" INTEGER NOT NULL,
    "problem_slug" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'easy',

    CONSTRAINT "roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "problem_id" UUID NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT true,
    "group_no" INTEGER,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_group_no_key" ON "groups"("group_no");

-- CreateIndex
CREATE UNIQUE INDEX "leetcoders_email_key" ON "leetcoders"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_problem_order_key" ON "roadmap"("problem_order");

-- AddForeignKey
ALTER TABLE "group_progress" ADD CONSTRAINT "group_progress_current_problem_fkey" FOREIGN KEY ("current_problem") REFERENCES "roadmap"("problem_order") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_progress" ADD CONSTRAINT "group_progress_group_no_fkey" FOREIGN KEY ("group_no") REFERENCES "groups"("group_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leetcoders" ADD CONSTRAINT "leetcoders_group_no_fkey" FOREIGN KEY ("group_no") REFERENCES "groups"("group_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_group_no_fkey" FOREIGN KEY ("group_no") REFERENCES "groups"("group_no") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "roadmap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "leetcoders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

