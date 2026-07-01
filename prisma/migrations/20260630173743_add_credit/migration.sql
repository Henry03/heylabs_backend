-- CreateTable
CREATE TABLE "Credit" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);
