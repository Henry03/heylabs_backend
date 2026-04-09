import { ParsedItem, ParsedOrder } from "../../interfaces/waybill.interface";

export const parseCommand = (message: string) => {
  if (!message) return null;

  const text =
    message.trim().toUpperCase();

  // if (text === "LIST") {
  //   return {
  //     command: "LIST"
  //   };
  // }

  if (text === "#LIST") 
    return {
      command: "LIST"
    }
  

  if (text.startsWith("TRACK")) {

      const parts =
          text.split(" ");

      return {
          command: "TRACK",
          trackingNumber:
          parts[1]
      };
  }

  if (text.startsWith("#ADDORDER")) {
    const raw =
      text
        .replace("#ADDORDER", "")
        .trim();

    return {
      command: "ADDORDER",
      raw
    }
  }

  if (text.startsWith("#ADDRESI")) {
    const parts = text.split(" ");

    return {
      command: "ADDRESI",
      itemId: parts[1],
      trackingNumber: parts[2]
    };

  }

  if (text.startsWith("#DELETEORDER")) {
    const parts = text.split(" ");

    return {
      command: "DELETEORDER",
      orderId: parts[1]
    };

  }

  if (text.startsWith("#DETAIL")) {

    const parts = text.split(" ");

    return {
      command: "DETAIL",
      orderId: parts[1]
    };

  }

  if (text.startsWith("#COMMAND")) {

    return {
      command: "COMMAND"
    };

  }

  return null;
};

export function parseCurrency(text: string): number {
  return Number(
    text
      .replace(/[^0-9-]/g, "")
  );
}

export function parseShopeeOrder(
  raw: string
): ParsedOrder {

  const lines = raw
    .split("\n")
    .map(l => l.trim())
    .filter(l => l !== "");

  let storeName = lines[0];

  const items: ParsedItem[] = [];

  let i = 1;

  while (i < lines.length) {

    const line =
      lines[i].toUpperCase();

    // STOP ketika subtotal
    if (
      line.includes("SUBTOTAL PRODUK")
    )
      break;

    const name = lines[i];

    let variation: string | undefined;
    let quantity = 1;

    let price = 0;
    let priceAfterDiscount = 0;
    let discount = 0;

    // =========================
    // VARIATION
    // =========================

    if (
      lines[i + 1]
        ?.toUpperCase()
        .startsWith("VARIASI")
    ) {

      variation =
        lines[i + 1]
          .replace(/VARIASI:/i, "")
          .trim();

      i++;

    }

    // =========================
    // QUANTITY
    // =========================

    if (
      lines[i + 1]
        ?.toUpperCase()
        .startsWith("X")
    ) {

      quantity = Number(
        lines[i + 1]
          .replace(/[^0-9]/g, "")
      );

      i++;

    }

    // =========================
    // PRICE (HANDLE DISCOUNT)
    // =========================

    if (
      lines[i + 1]
        ?.toUpperCase()
        .includes("RP")
    ) {

      let priceLine =
        lines[i + 1];

      // cek jika next line juga harga
      if (
        lines[i + 2]
          ?.toUpperCase()
          .startsWith("RP")
      ) {

        priceLine +=
          lines[i + 2];

        i++;

      }

      console.log(priceLine)

      const parsedPrice =
        parsePriceText(
          priceLine
        );

        console.log(parsedPrice)

      priceAfterDiscount =
        parsedPrice.priceAfterDiscount || 0;

      price = parsedPrice.price;
      
      discount = parsedPrice.price - priceAfterDiscount

      i++;

    }

    items.push({

      name,

      variation,

      quantity,

      price,

      discount

    });

    i++;

  }

  // ===== TOTAL SECTION =====

  let subtotalProduct = 0;
  let shippingCost = 0;
  let shippingDiscount = 0;
  let voucher = 0;
  let serviceFee = 0;
  let totalAmount = 0;

  for (let j = 0; j < lines.length; j++) {

    const line =
      lines[j].toUpperCase();

    if (
      line.includes("SUBTOTAL PRODUK")
    ) {

      subtotalProduct =
        parseCurrency(
          lines[j + 1]
        );

    }

    if (
      line.includes("SUBTOTAL PENGIRIMAN")
    ) {

      shippingCost =
        parseCurrency(
          lines[j + 1]
        );

    }
    if (
      line.includes(
        "VOUCHER SHOPEE DIGUNAKAN"
      )
    ) {
      console.log("test")
      voucher =
        parseCurrency(
          lines[j + 1]
        );

        console.log(voucher)

    }

    if (
      line.includes(
        "SUBTOTAL DISKON PENGIRIMAN"
      )
    ) {

      shippingDiscount =
        parseCurrency(
          lines[j + 1]
        );

    }

    if (
      line.includes("BIAYA LAYANAN")
    ) {

      serviceFee =
        parseCurrency(
          lines[j + 1]
        );

    }

    if (
      line.includes("TOTAL PESANAN")
    ) {

      totalAmount =
        parseCurrency(
          lines[j + 1]
        );

    }

  }

  return {

    storeName,

    items,

    subtotalProduct,

    shippingCost,

    shippingDiscount,
    voucher,

    serviceFee,

    totalAmount

  };

}

function parsePriceText(priceText: string) {

  const matches =
    priceText.match(/rp\s*[\d\.]+/gi);

  if (!matches) {
    return {
      price: 0,
      priceAfterDiscount: 0
    };
  }

  const toNumber = (text: string) =>
    Number(
      text
        .replace(/rp/i, "")
        .replace(/\./g, "")
        .trim()
    );

  if (matches.length === 1) {

    const value =
      toNumber(matches[0]);

    return {
      price: value,
      priceAfterDiscount: value
    };

  }

  return {

    price:
      toNumber(matches[0]),

    priceAfterDiscount:
      toNumber(matches[1])

  };

}

export function getOrderStatus(order: {
  trackingNumber: string | null;
  deliveredAt: Date | null;
}): string {

  if (!order.trackingNumber)
    return "📦 Belum Dikirim";

  if (order.trackingNumber && !order.deliveredAt)
    return "🚚 Dikirim";

  if (order.deliveredAt)
    return "✅ Delivered";

  return "-";
}

export function truncateText(
  text: string,
  maxLength: number = 30
): string {

  if (text.length <= maxLength)
    return text;

  return text.slice(0, maxLength) + "...";
}

export function detectCourier(
  trackingNumber: string
): string {

  if (trackingNumber.startsWith("SPX"))
    return "SPX";

  if (trackingNumber.startsWith("JNE"))
    return "JNE";

  if (trackingNumber.startsWith("J&T"))
    return "J&T";

  return "UNKNOWN";
}