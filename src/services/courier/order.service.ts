import prisma from "../../utils/prisma";
import { detectCourier } from "../../utils/courier/utils";
import cron from "node-cron";
import { getSPXTracking } from "./spx.service";
import { sendWhatsappMessage } from "./waha.service";

export async function saveOrder(
  parsed: any
) {

  const order =
    await prisma.order.create({
      data: {
        trackingNumber:
          parsed.trackingNumber,

        storeName: parsed.storeName,

        courier:
          parsed.courier,

        subtotalProduct:
          parsed.subtotalProduct,

        shippingCost:
          parsed.shippingCost,

        shippingDiscount:
          parsed.shippingDiscount,
        
        voucher: parsed.voucher,

        serviceFee:
          parsed.serviceFee,

        totalAmount:
          parsed.totalAmount,

        items: {

          create:
            parsed.items

        }

      },

      include: {
        items: true
      }

    });

  return order;

}

export async function getOrderList() {

  return prisma.order.findMany({
    take: 10,
    orderBy: {
      id: "desc"
    },
    include: {
      items: true
    }
  });

}

export async function addTrackingNumber(
  itemId: number,
  trackingNumber: string
) {

  // cari item
  const item =
    await prisma.orderItem.findUnique({
      where: {
        id: itemId
      },
      include: {
        order: true
      }
    });

  if (!item) {
    throw new Error("ITEM_NOT_FOUND");
  }

  // update order
  const updatedOrder =
    await prisma.order.update({
      where: {
        id: item.orderId
      },
      data: {
        trackingNumber,
        courier: detectCourier(trackingNumber)
      }
    });

  return {
    item,
    order: updatedOrder
  };

}

export async function deleteOrder(
  orderId: number
) {

  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId
      }
    });

  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  await prisma.order.delete({
    where: {
      id: orderId
    }
  });

  return order;

}

export async function getOrderDetail(
  orderId: number
) {

  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId
      },
      include: {
        items: true
      }
    });

  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  return order;

}

export async function setDeliveredAt(
    time: Date,
    orderId : number
){
    await prisma.order.update({
        where: { id: orderId },
        data: {
            deliveredAt : time
        }
    });
}

const WA_GROUP_NUMBER = "120363423177827833@g.us";

cron.schedule("0 * * * *", async () => {
  console.log("Running hourly package tracker...");
  const orders = await prisma.order.findMany({
    where: {
      trackingNumber: { not: null },
      deliveredAt: null
    }
  });

  for (const order of orders) {
    try {
      const tracking = await getSPXTracking(order.trackingNumber!);
      const orderInfo = tracking?.data?.sls_tracking_info;

      if (!orderInfo) continue;

      const latestHistory = orderInfo.records[0];
      const status = latestHistory.tracking_name;
      const actualTimeUnix = latestHistory.actual_time;

      if (status.toLowerCase() === "delivered" && actualTimeUnix) {
        const deliveredAt = new Date(actualTimeUnix * 1000);

        await prisma.order.update({
          where: { id: order.id },
          data: { deliveredAt: deliveredAt }
        });

        // Send WhatsApp message to group
        const message = `📦 Paket untuk order *${order.id}* telah sampai!\n` +
          `Mohon video unboxing tidak lebih dari 3 hari. Jika tidak, tidak bisa melakukan complain.`;

        await sendWhatsappMessage(WA_GROUP_NUMBER, message);

        console.log(`Order ${order.id} marked as delivered and message sent.`);
      }
    } catch (err) {
      console.error(`Error tracking order ${order.id}:`, err);
    }
  }
});