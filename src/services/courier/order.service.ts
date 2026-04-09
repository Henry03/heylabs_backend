import prisma from "../../utils/prisma";
import { detectCourier, truncateText } from "../../utils/courier/utils";
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
  orderId: number,
  courier: string,
  trackingNumber: string
) {

  // cari item
  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId
      },
      include: {
        items: true
      }
    });

  if (!orderId) {
    throw new Error("ORDER_NOT_FOUND");
  }

  // update order
  const updatedOrder =
    await prisma.order.update({
      where: {
        id: order?.id
      },
      data: {
        trackingNumber,
        courier: courier
      }
    });

  return {
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

  for (const dbOrder of orders) {
    try {

      const tracking =
        await getSPXTracking(
          dbOrder.trackingNumber!
        );

      const orderInfo =
        tracking?.data?.sls_tracking_info;

      if (!orderInfo) continue;

      const latestHistory =
        orderInfo.records[0];

      const status =
        latestHistory.tracking_name;

      const actualTimeUnix =
        latestHistory.actual_time;

      // =========================
      // CHECK DELIVERED
      // =========================

      if (
        status.toLowerCase() === "delivered"
        && actualTimeUnix
      ) {

        const deliveredAt =
          new Date(actualTimeUnix * 1000);

        // update deliveredAt
        await prisma.order.update({
          where: { id: dbOrder.id },
          data: { deliveredAt }
        });

        // =========================
        // GET FULL ORDER DETAIL
        // =========================

        const order =
          await getOrderDetail(
            dbOrder.id
          );

        let text =
`📦 *PAKET TELAH SAMPAI*`
+`\n━━━━━━━━━━━━━`
+`\n🧾 Order ID : ${order.id}`
+`\n🏪 Store    : ${order.storeName}`
+`\n`
+`\n📦 *Daftar Barang*`;

        order.items.forEach(
          (item, index) => {

            const harga =
              (item.price - item.discount)
              / item.quantity;

            const subtotal =
              (harga * item.quantity)
              / order.subtotalProduct
              * order.totalAmount;

            const shortName =
              truncateText(
                item.name,
                50
              );

            text +=
`\n━━━━━━━━━━━━━`
+`\n[${index + 1}️] ${item.name}`
+`\n🏷️ Variant : ${item.variation || "-"}`
+`\n💰 Harga    : Rp${harga.toLocaleString()}`
+`\n🔢 Qty      : ${item.quantity}`
+`\n💵 Subtotal : Rp${subtotal.toLocaleString()}`;

          }
        );

        text +=
`\n━━━━━━━━━━━━━`
+`\n`
+`\n💵 *TOTAL PESANAN*`
+`\nRp${order.totalAmount.toLocaleString()}`
+`\n`
+`\n🚚 *STATUS PAKET*`
+`\n━━━━━━━━━━━━━`
+`\n🔎 No. Resi`
+`\n${order.trackingNumber}`
+`\n`
+`\n📍 Status`
+`\n_${status}_`
+`\n`
+`\n`;

        // =========================
        // ⚠️ WARNING UNBOXING
        // =========================

        text +=
`━━━━━━━━━━━━━`
+`\n⚠️ *PENTING — VIDEO UNBOXING WAJIB*`
+`\n━━━━━━━━━━━━━`
+`\n`
+`\n📹 Harap rekam *VIDEO UNBOXING*`
+`\nsaat membuka paket.`
+`\n`
+`\n⏳ Maksimal *3 HARI*`
+`\nsetelah paket diterima.`
+`\n`
+`\n❌ Jika tidak ada video`
+`\nmaka *TIDAK BISA COMPLAIN*.`
+`\n`
+`\n🙏 Mohon diperhatikan.`
+`\nTerima kasih.`;

        // =========================
        // SEND TO GROUP
        // =========================

        await sendWhatsappMessage(
          WA_GROUP_NUMBER,
          text
        );

        console.log(
          `Order ${order.id} delivered notification sent.`
        );

      }

    } catch (err) {

      console.error(
        `Error tracking order ${dbOrder.id}:`,
        err
      );

    }
  }

});