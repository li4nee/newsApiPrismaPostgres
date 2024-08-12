/*
  Warnings:

  - Made the column `profile` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "profile" SET NOT NULL,
ALTER COLUMN "profile" SET DEFAULT 'https://res.cloudinary.com/dd75jq2s9/image/upload/v1723286560/zxvexbvgumne6xn1u0db.png';
