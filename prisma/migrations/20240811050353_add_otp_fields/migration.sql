-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isValidated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otp" VARCHAR(6),
ADD COLUMN     "otpExpires" TIMESTAMP(3);
