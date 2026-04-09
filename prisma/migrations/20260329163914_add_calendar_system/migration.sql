-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('owner', 'editor', 'viewer');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('whatsapp', 'teams');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "CalendarProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reminderMinutesBefore" INTEGER NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "useAI" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderChannel" (
    "reminderId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,

    CONSTRAINT "ReminderChannel_pkey" PRIMARY KEY ("reminderId","channelId")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "response" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "target" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarMember_projectId_userId_key" ON "CalendarMember"("projectId", "userId");

-- AddForeignKey
ALTER TABLE "CalendarProject" ADD CONSTRAINT "CalendarProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarMember" ADD CONSTRAINT "CalendarMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CalendarProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarMember" ADD CONSTRAINT "CalendarMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CalendarProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderChannel" ADD CONSTRAINT "ReminderChannel_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderChannel" ADD CONSTRAINT "ReminderChannel_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
