import {
  getOrderStatus,
  parseCommand,
  parseShopeeOrder,
  truncateText
} from "../../utils/courier/utils"

import {
  getSPXTracking,
  getTracking
} from "../../services/courier/track.service";

import {
  sendWhatsappDocument,
  sendWhatsappMessage
} from "../../services/courier/waha.service";
import { addTrackingNumber, deleteOrder, getOrderDetail, getOrderList, saveOrder, setDeliveredAt } from "../../services/courier/order.service";
import { addCredit, deleteCredit, getCreditList } from "../../services/courier/credit.service";
import { generateMonthlyData } from "../../services/courier/report.service";
import { buildMonthlyPDF } from "../../utils/reports/monthlyReport";
import { formatDate, rupiah } from "../../utils/reports/pdfHelper";

//211973883093135@lid mama
//264668920737929@lid henry
//120363411427876906@g.us grup isi pulsa
//113357172563989@lid center family pulsa

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

      const centerFamily = "113357172563989@lid";
      const grupIsiPulsa = "120363411427876906@g.us";
      const kode = "368247";

      if(from == grupIsiPulsa) {
        if (message.endsWith(`.${kode}`)) {
          
          await sendWhatsappMessage(
            centerFamily,
            message
          );
        }
      }

      if(from == centerFamily) {
        await sendWhatsappMessage(
          grupIsiPulsa,
          message
        );
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
        const page = Number(command.page) || 1;
        const limit = 20;
        const limit = 20;

        const orders = await getOrderList(page, limit);

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
          text += `===============\n`;
          text += `[${order.id}] - ${truncateText(order.storeName, 25)} - ${status}\n`;

          order.items.forEach(item => {

            const shortName =
              truncateText(item.name, 60);

            const shortVariation =
              item.variation
                ? truncateText(item.variation, 20)
                : "-";

            text +=
        ` 🔹 ${shortName}\n`;

            text +=
        ` 🏷️ Variant: ${shortVariation}\n\n`;

          });

        });

        text += `\n\n📄 Page ${page}\n`;

        if (orders.length === limit) {
          text += `➡️ Ketik: #LIST ${page + 1} untuk lanjut\n`;
        }

        if (page > 1) {
          text += `⬅️ Ketik: #LIST ${page - 1} untuk kembali\n`;
        }

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

      if (command.command === "COMPLETEORDER") {
        try {

          const orderId =
            Number(command.orderId);

          if (!orderId || isNaN(orderId)) {
            await sendWhatsappMessage(
              from,
              "❌ Format salah.\nGunakan:\n#COMPLETEORDER [ID ORDER]"
            );
            return;
          }


          const date = new Date();
          const orderDetail = await getOrderDetail(orderId)

          if(!orderDetail) {
            await sendWhatsappMessage(
              from,
              "❌ Order tidak ditemukan."
            );
            return;
          }

            await setDeliveredAt(date, orderDetail.id)

            await sendWhatsappMessage(
                  from,
            `🗑️ Order completed!

            📦 Order ID: ${orderDetail.id}
            🏪 Courier : ${orderDetail.courier}
            🏪 Resi: ${orderDetail.trackingNumber}
            🏪 Delivered At: ${date}`
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
            "❌ Gagal complete order."
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

      ;

          const subtotalProduct = order.items.reduce((total, item) => {
            return total + ((item.price - item.discount) * item.quantity);
          }, 0);

          order.items.forEach(
            (item, index) => {

            const harga = (item.price - item.discount) * item.quantity / subtotalProduct * order.totalAmount/item.quantity;

            const subtotal =
              Math.ceil((harga * item.quantity))

              const shortName =
                truncateText(
                  item.name,
                  50
                );

              text +=
          `\n━━━━━━━━━━━━━`
          +`\n[${index + 1}️] ${item.name}`
          +`\n🏷️ Variant : ${item.variation || "-"}`
          +`\n💰 Harga    : Rp${Math.ceil(harga).toLocaleString()}`
          +`\n🔢 Qty      : ${item.quantity}`
          +`\n💵 Subtotal : Rp${subtotal.toLocaleString()}`;

            }
          );

            text +=
            `\n━━━━━━━━━━━━━`
            + `\n\n💵 *TOTAL PESANAN*`
            + `\nRp${Math.ceil(order.totalAmount).toLocaleString()}\n`;

          // =========================
          // TRACKING SPX
          // =========================

          if (order.trackingNumber) {
            const tracking =
              await getSPXTracking(
                order.trackingNumber
              );
              console.log(tracking)
              if(tracking?.retcode == 0){
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
                const generalTrack = await getTracking(
                  order.trackingNumber,
                  order.courier?.toLowerCase() || ""
                );

                console.log(generalTrack)

                const orderGeneralInfo = generalTrack.data;

                if (orderGeneralInfo) {
                  const latestHistory = orderGeneralInfo.history[0];
                  const status = orderGeneralInfo.summary.status;
                  const description = latestHistory.desc;
                  const currentLocation = "-";
                  const actualTimeUnix = latestHistory.date;
    
                  const deliveredAt =
                    status.toLowerCase() === "delivered" && actualTimeUnix
                      ? new Date(actualTimeUnix)
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

        +`\n\n💰 KEUANGAN`
        +`\n━━━━━━━━━━━━━`
        +`\n`
        +`\n#KREDIT [Nama] [Bank] [Nominal]`
        +`\n→ Tambah kredit`
        +`\n`
        +`\n#LISTKREDIT`
        +`\n→ Daftar kredit`
        +`\n`
        +`\n#DELETEKREDIT [ID]`
        +`\n→ Hapus kredit`
        ;

          await sendWhatsappMessage(
            from,
            text
          );

        }

      if(command.command==="KREDIT"){
        try{
          const name =
              command.name;
          const bank =
              command.bank;
          const nominal =
              Number(
                  command.nominal
                      ?.replace(/[^0-9]/g,"")
              );

          if(
              !name ||
              !bank ||
              !nominal
          ){

              await sendWhatsappMessage(
                  from,
              `❌ Format salah

              #KREDIT [Nama] [Bank] [Nominal]

              Contoh

              #KREDIT Henry BCA 5000000`
              );

              return;

          }

          const credit =
            await addCredit(
                name,
                bank,
                nominal
            );

          await sendWhatsappMessage(
            from,
            `✅ Kredit berhasil ditambahkan
            ID : ${credit.id}
            Nama :
            ${credit.name}
            Bank :
            ${credit.bank}
            Nominal :
            Rp${credit.nominal.toLocaleString("id-ID")}`
            );
          }
          catch(err){
            console.error(err);

            await sendWhatsappMessage(
                from,
                "Gagal menambah kredit."
            );
          }
        }

      if(command.command==="LISTKREDIT"){

            const page =
                Number(command.page)||1;

            const limit=10;

            const credits =
                await getCreditList(
                    page,
                    limit
                );

            if(!credits.length){

                await sendWhatsappMessage(
                    from,
                    "Belum ada kredit."
                );

                return;
            }

            let text=
`💰 *DAFTAR KREDIT*

`;

          credits.forEach((item,index)=>{
            text+=
`[${item.id}] ${item.createdAt.toLocaleDateString("id-ID")}
${item.name} - ${item.bank}
Rp${item.nominal.toLocaleString("id-ID")}

`;
          });

          await sendWhatsappMessage(
              from,
              text
          );
      }

      if(command.command==="DELETEKREDIT"){
        try{
            const id=
                Number(command.id);

            if(!id){
                await sendWhatsappMessage(
                    from,
                    "Format:\n#DELETEKREDIT [ID]"
                );

                return;
            }

            const credit=
              await deleteCredit(id);

              await sendWhatsappMessage(
                from,
      `✅ Kredit berhasil dihapus

      ${credit.name}

      Rp${credit.nominal.toLocaleString("id-ID")}`
              );
            }

            catch(err:any){
              if(
                  err.message==="CREDIT_NOT_FOUND"
              ){
                  await sendWhatsappMessage(
                      from,
                      "Kredit tidak ditemukan."
                  );
                  return;
              }

              await sendWhatsappMessage(
                  from,
                  "Gagal menghapus kredit."
              );
            }

      }

      if(command.command==="REPORT"){

        try{

            const month =
                command.month;

            const year =
                command.year;

            if(

                !month ||

                !year

            ){

                await sendWhatsappMessage(

                    from,

    `Format

    #REPORT [bulan] [tahun]

    Contoh

    #REPORT 6 2026`

                );

                return;

            }

    //         
    const pdf =
    await buildMonthlyPDF(
        month,
        year
    );

const report = await generateMonthlyData(month, year);

const caption =
`📊 *MONTHLY FINANCIAL REPORT*

📅 ${formatDate(report.start)} - ${formatDate(
    new Date(report.end.getTime() - 1)
)}

💰 Total Uang Masuk
${rupiah(report.totalCredit)}

🛒 Total Belanja
${rupiah(report.totalOrder)}

💵 Sisa Uang
${rupiah(report.closingBalance)}

📎 Laporan PDF terlampir.`;

await sendWhatsappDocument(
    from,
    pdf,
    `${caption}`
)
        }

        catch(err){

            console.error(err);

        }

    }
    } catch (error: any) {
      console.error(error);

      return res.sendStatus(500);

    }
};
