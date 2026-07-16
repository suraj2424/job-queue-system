/*
  Warnings:

  - You are about to drop the column `workeId` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "workeId",
ADD COLUMN     "workerId" TEXT;
