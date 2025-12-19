-- CreateTable
CREATE TABLE "Hymn" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "lyrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hymn_pkey" PRIMARY KEY ("id")
);
