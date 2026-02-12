/*
  Warnings:

  - You are about to drop the column `userId` on the `Hymn` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Hymn` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Hymn" DROP CONSTRAINT "Hymn_userId_fkey";

-- AlterTable
ALTER TABLE "Hymn" DROP COLUMN "userId",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "User";
