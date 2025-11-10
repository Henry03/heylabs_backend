-- CreateTable
CREATE TABLE "TopUpLog" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "receiverId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "TopUpLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TopUpLog" ADD CONSTRAINT "TopUpLog_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopUpLog" ADD CONSTRAINT "TopUpLog_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
