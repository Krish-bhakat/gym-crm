/*
  Warnings:

  - You are about to drop the column `twilioNumber` on the `Gym` table. All the data in the column will be lost.
  - You are about to drop the column `twilioSid` on the `Gym` table. All the data in the column will be lost.
  - You are about to drop the column `twilioToken` on the `Gym` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Plan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "checkOut" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Gym" DROP COLUMN "twilioNumber",
DROP COLUMN "twilioSid",
DROP COLUMN "twilioToken";

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "planId" INTEGER;

-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "price" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "TwilioSettings" (
    "id" SERIAL NOT NULL,
    "gymId" INTEGER NOT NULL,
    "accountSid" TEXT NOT NULL,
    "authToken" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "enableWelcome" BOOLEAN NOT NULL DEFAULT false,
    "welcomeTemplate" TEXT NOT NULL DEFAULT 'Welcome to {gym_name}! Your membership is now active.',
    "enableBirthday" BOOLEAN NOT NULL DEFAULT false,
    "birthdayTemplate" TEXT NOT NULL DEFAULT 'Happy Birthday {member_name}! Have a great day from {gym_name}.',
    "enableRenewal" BOOLEAN NOT NULL DEFAULT false,
    "renewalDaysBefore" INTEGER NOT NULL DEFAULT 3,
    "renewalTemplate" TEXT NOT NULL DEFAULT 'Hi {member_name}, your plan at {gym_name} expires in 3 days. Please renew!',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwilioSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "biometricId" TEXT,
    "phoneNumber" TEXT,
    "gymId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" SERIAL NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOut" TIMESTAMP(3),
    "staffId" INTEGER NOT NULL,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TwilioSettings_gymId_key" ON "TwilioSettings"("gymId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_biometricId_key" ON "Staff"("biometricId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwilioSettings" ADD CONSTRAINT "TwilioSettings_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
