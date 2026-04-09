import {
  getOrderStatus,
  parseCommand,
  parseShopeeOrder,
  truncateText
} from "../../utils/courier/utils"

import {
  getSPXTracking
} from "../../services/courier/spx.service";

import {
  sendWhatsappMessage
} from "../../services/courier/waha.service";
import { addTrackingNumber, deleteOrder, getOrderDetail, getOrderList, saveOrder, setDeliveredAt } from "../../services/courier/order.service";

export const wahaWebhook =
  async (req: any, res: any) => {

    try {

      const body = req.body;

      const message =
        body?.payload?.body;

      const from =
        body?.payload?.from;

      if (!message) {

        return res.sendStatus(200);

      }

      const command = parseCommand(message);
      if (!command) {
        return res.sendStatus(200);
      }

      if(command.command === "TRACK") {
        const trackingNumber = command.trackingNumber;

        if (!trackingNumber) {
          await sendWhatsappMessage(
            from,
            "❌ Format salah.\nGunakan:\nTRACK SPX123456789"
          );

          return res.sendStatus(200);
        }
        const tracking = await getSPXTracking(
            trackingNumber
          );
  
        const orderInfo = tracking?.data?.sls_tracking_info ;
  
        if (!orderInfo) {
          await sendWhatsappMessage(
            from,
            `❌ Resi tidak ditemukan`
          );
  
          return res.sendStatus(200);
        }
  
        
        const latestHistory = orderInfo.records[0];
        const status = latestHistory.tracking_name;
        const description = latestHistory.description;
        const currentLocation = latestHistory.current_location.location_name;
  
        let text =
        `📦 *TRACKING PAKET*\n` +
        `━━━━━━━━━━━━━\n` +
  
        `🔎 *No. Resi*\n` +
        `${trackingNumber}\n\n` +
  
        `📍 *Status Saat Ini*\n` +
        `_${status}_\n\n` +
  
        `📌 *Lokasi Paket*\n` +
        `${currentLocation}\n\n` +
  
        `📝 *Deskripsi*\n` +
        `${description}`
  
        await sendWhatsappMessage(
          from,
          text
        );
  
        return res.sendStatus(200);

      }

      // if (command.command === "LIST") {
      //   const userPackages = [

      //     {
      //       trackingNumber:
      //         "SPXID061020574804",

      //       status:
      //         "Dalam Pengiriman"
      //     },

      //     {
      //       trackingNumber:
      //         "SPXID123456789",

      //       status:
      //         "Sedang Diproses"
      //     },

      //     {
      //       trackingNumber:
      //         "SPXID987654321",

      //       status:
      //         "Dalam Perjalanan"
      //     }

      //   ];


      //   let text =
      // `📦 *DAFTAR PAKET KAMU*\n` +
      // `━━━━━━━━━━━━━━━━━━\n\n`;

      //   userPackages.forEach(
      //     (pkg, index) => {

      //       text +=
      // `${index + 1}. ${pkg.trackingNumber}\n`;

      //       if (pkg.status) {

      //         text +=
      // `   📍 ${pkg.status}\n`;

      //       }

      //       text += "\n";

      //     }
      //   );

      //   text +=
      // `━━━━━━━━━━━━━━━━━━\n` +
      // `💬 Balas *angka* untuk memilih\n` +
      // `atau ketik:\n` +
      // `TRACK SPX123456789`;

      //   await sendWhatsappMessage(
      //     from,
      //     text
      //   );

      //   return res.sendStatus(200);

      // }

      if(command.command === "LIST") {
        const orders = await getOrderList();

        if (orders.length === 0) {

          await sendWhatsappMessage(
            from,
            "📭 Tidak ada pesanan."
          );

          return;
        }

        let text =
        `📦 *LIST PESANAN*\n\n`;

        orders.forEach(order => {

          const status =
            getOrderStatus(order);
          text += `============\n`;
          text += `[${order.id}] - ${truncateText(order.storeName, 25)} - ${status}\n`;

          order.items.forEach(item => {

            const shortName =
              truncateText(item.name, 25);

            const shortVariation =
              item.variation
                ? truncateText(item.variation, 15)
                : "-";

            text +=
        ` 🔹 ${shortName}\n`;

            text +=
        ` 🏷️ Variant: ${shortVariation}\n\n`;

          });

          text += "\n";

        });

        text +=
        `Ketik:\n#DETAIL [ID ORDER]\nuntuk cek detail.`;

        await sendWhatsappMessage(
          from,
          text
        );
      }

      if(command.command === "ADDORDER") {
        const raw = command.raw;
        if (!raw) {
          await sendWhatsappMessage(
            from,
            "❌ Tidak ada detail order"
          );

          return res.sendStatus(200);
        }
          const result =
            parseShopeeOrder(raw);
          const order = await saveOrder(result);

          await sendWhatsappMessage(
            from,
          `✅ Pesanan berhasil dibaca`
          +`\n🆔 ID: ${order.id}`
          +`\n${order.storeName}`
          +`\n🏪 Toko:`
          +`\n${order.storeName}`
          +`\n📦 Resi:`
          +`\n${order.trackingNumber ?? "-"}`
          +`\n🧾 Item:`
          +`\n${order.items.length}`
          +`\n💰 Total:`
          +`\nRp${order.totalAmount.toLocaleString("id-ID")}`
          );
      }

      if(command.command === "ADDRESI") {
        try {
          const orderId =
            Number(command.orderId);

          const courier = command.courier;

          const trackingNumber =
            command.trackingNumber;

          if (!orderId || !trackingNumber || !courier) {

            await sendWhatsappMessage(
              from,
              "❌ Format salah.\nGunakan:\n#ADDRESI [ID] [COURIER] [NORESI]"
            );

            return;
          }

          const result =
            await addTrackingNumber(
              orderId,
              courier,
              trackingNumber
            );

          await sendWhatsappMessage(
            from,
            `✅ Resi berhasil ditambahkan!`
            +`\n📦 Item ID : ${result.order.id}`
            +`\n📮 No Resi :${trackingNumber}`
          );

        } catch (error: any) {

          if (error.message === "ITEM_NOT_FOUND") {

            await sendWhatsappMessage(
              from,
              "❌ Item tidak ditemukan."
            );

            return;
          }

          console.error(error);

          await sendWhatsappMessage(
            from,
            "❌ Terjadi kesalahan saat menambahkan resi."
          );

        }
      }

      if (command.command === "DELETEORDER") {
        try {

          const orderId =
            Number(command.orderId);

          if (!orderId) {

            await sendWhatsappMessage(
              from,
              "❌ Format salah.\nGunakan:\n#DELETEORDER [ID ORDER]"
            );

            return;

          }

          const deletedOrder =
            await deleteOrder(orderId);

          await sendWhatsappMessage(
            from,
      `🗑️ Order berhasil dihapus!

      📦 Order ID: ${deletedOrder.id}
      🏪 Toko: ${deletedOrder.storeName}`
          );

        } catch (error: any) {

          if (error.message === "ORDER_NOT_FOUND") {

            await sendWhatsappMessage(
              from,
              "❌ Order tidak ditemukan."
            );

            return;

          }

          console.error(error);

          await sendWhatsappMessage(
            from,
            "❌ Gagal menghapus order."
          );

        }

      }

      if (command.command === "DETAIL") {

        try {

          const orderId =
            Number(command.orderId);

          if (!orderId) {

            await sendWhatsappMessage(
              from,
              "❌ Format salah.\nGunakan:\n#DETAIL [ORDERID]"
            );

            return;

          }

          const order =
            await getOrderDetail(orderId);

          let text =
      `📦 *DETAIL ORDER*`
      + `\n━━━━━━━━━━━━━`
      + `\n🧾 Order ID : ${order.id}`
      + `\n🏪 Store    : ${order.storeName}`
      + `\n\n📦 *Daftar Barang*`
      + `\n━━━━━━━━━━━━━`
      ;

          let total = 0;

          order.items.forEach(
            (item, index) => {

              const harga = (item.price - item.discount)/item.quantity;
              const subtotal = (harga*item.quantity)/order.subtotalProduct*order.totalAmount;

              const shortName =
                truncateText(
                  item.name,
                  30
                );

              text +=
          `\n${index + 1}️ ${shortName}`
          +`\n🏷️ Variant : ${item.variation || "-"}`
          +`\n💰 Harga    : Rp${harga.toLocaleString()}`
          +`\n🔢 Qty      : ${item.quantity}`
          +`\n💵 Subtotal : Rp${subtotal.toLocaleString()}`;

            text +=
            `\n━━━━━━━━━━━━━`
            + `\n💰 *RINCIAN BIAYA*`
            + `\n━━━━━━━━━━━━━`
            + `\n\n💵 *TOTAL PESANAN*`
            + `\nRp${order.totalAmount.toLocaleString()}`;

            }
          );

          // =========================
          // TRACKING SPX
          // =========================

          if (order.trackingNumber) {

            const tracking =
              await getSPXTracking(
                order.trackingNumber
              );

            const orderInfo =
              tracking?.data?.sls_tracking_info;

            if (orderInfo) {
              const latestHistory = orderInfo.records[0];
              const status = latestHistory.tracking_name;
              const description = latestHistory.description;
              const currentLocation = latestHistory.current_location.location_name;
              const actualTimeUnix = latestHistory.actual_time;

              const deliveredAt =
                status.toLowerCase() === "delivered" && actualTimeUnix
                  ? new Date(actualTimeUnix * 1000)
                  : null;

              if (deliveredAt) {
                await setDeliveredAt(deliveredAt, order.id)
              }

              text +=
                `\n━━━━━━━━━━━━━`
                +`\n🚚 *STATUS PAKET*`
                +`\n━━━━━━━━━━━━━`
                +`\n🔎 No. Resi`
                +`\n${order.trackingNumber}`
                +`\n📍 Status Saat Ini`
                +`\n_${status}_`
                +`\n📌 Lokasi Paket`
                +`\n${currentLocation}`
                +`\n📝 Deskripsi`
                +`\n${description}`;

            }

          } else {

            text +=
      `\n━━━━━━━━━━━━━`
      +`\n🚚 *STATUS PAKET*`
      +`\n━━━━━━━━━━━━━`
      +`\n📭 Belum dikirim`
      +`\n(No Resi tersedia)`;

          }

          await sendWhatsappMessage(
            from,
            text
          );

        } catch (error: any) {

          if (
            error.message ===
            "ORDER_NOT_FOUND"
          ) {

            await sendWhatsappMessage(
              from,
              "❌ Order tidak ditemukan."
            );

            return;

          }

          console.error(error);

          await sendWhatsappMessage(
            from,
            "❌ Gagal mengambil detail order."
          );

        }

      }

      if (command.command === "COMMAND") {

        let text =
        `🤖 *DAFTAR PERINTAH BOT*`
        +`\n━━━━━━━━━━━━━`
        +`\n\n📦 *ORDER*`
        +`\n#LIST`
        +`\n→ Melihat daftar order`
        +`\n#DETAIL [ORDERID]`
        +`\n→ Melihat detail order`
        +`\n#DELETEORDER [ORDERID]`
        +`\n→ Menghapus order`
        +`\n━━━━━━━━━━━━━`
        +`\n\n🚚 *PENGIRIMAN*`
        +`\n#ADDRESI [ITEMID] [NORESI]`
        +`\n→ Menambahkan nomor resi`
        +`\n#TRACK [NORESI]`
        +`\n→ Melihat status paket`
        +`\n━━━━━━━━━━━━━`
        +`\n\n📖 *BANTUAN*`
        +`\n#COMMAND`
        +`\n→ Menampilkan semua perintah`
        ;

          await sendWhatsappMessage(
            from,
            text
          );

        }

    } catch (error: any) {
      console.error(error);

      return res.sendStatus(500);

    }
};