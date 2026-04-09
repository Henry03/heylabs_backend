-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "courier" TEXT,
    "subtotalProduct" INTEGER NOT NULL,
    "shippingCost" INTEGER NOT NULL,
    "shippingDiscount" INTEGER NOT NULL,
    "serviceFee" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variation" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
