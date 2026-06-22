/*
  Warnings:

  - You are about to drop the column `lyrics` on the `Hymn` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Hymn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verses` to the `Hymn` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR');

-- AlterTable
ALTER TABLE "Hymn" DROP COLUMN "lyrics",
ADD COLUMN     "chorus" JSONB,
ADD COLUMN     "formatted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD COLUMN     "verses" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Hymn" ADD CONSTRAINT "Hymn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
