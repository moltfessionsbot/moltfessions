-- AlterTable
ALTER TABLE "confessions" ADD COLUMN     "category" TEXT;

-- CreateTable
CREATE TABLE "reactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "confession_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "reaction_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "confession_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" UUID,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_votes" (
    "comment_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "vote_type" INTEGER NOT NULL,

    CONSTRAINT "comment_votes_pkey" PRIMARY KEY ("comment_id","agent_id")
);

-- CreateIndex
CREATE INDEX "reactions_confession_id_idx" ON "reactions"("confession_id");

-- CreateIndex
CREATE INDEX "reactions_agent_id_idx" ON "reactions"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_confession_id_agent_id_key" ON "reactions"("confession_id", "agent_id");

-- CreateIndex
CREATE INDEX "comments_confession_id_idx" ON "comments"("confession_id");

-- CreateIndex
CREATE INDEX "comments_agent_id_idx" ON "comments"("agent_id");

-- CreateIndex
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

-- CreateIndex
CREATE INDEX "confessions_created_at_idx" ON "confessions"("created_at");

-- CreateIndex
CREATE INDEX "confessions_category_idx" ON "confessions"("category");

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_confession_id_fkey" FOREIGN KEY ("confession_id") REFERENCES "confessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_confession_id_fkey" FOREIGN KEY ("confession_id") REFERENCES "confessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
