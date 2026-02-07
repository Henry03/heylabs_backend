export interface ReceiptResult {
  valid_receipt: boolean;
  merchant: MerchantInfo | null;
  transaction: TransactionInfo | null;
  items: ReceiptItem[];
  summary: ReceiptSummary | null;
  currency: string | null;
}

export interface MerchantInfo {
  name: string | null;
  address: string | null;
  phone: string | null;
}

export interface TransactionInfo {
  receipt_number: string | null;
  date: string | null; // ISO 8601 (YYYY-MM-DD)
  time: string | null; // HH:mm

  payment_details: PaymentDetail[] | null;
}

export interface PaymentDetail {
  method:
    | "cash"
    | "credit_card"
    | "debit_card"
    | "voucher"
    | "ewallet"
    | "transfer"
    | "other";

  provider: string | null; // BCA, OVO, MAP Voucher, etc
  amount: number | null;
}

export interface ReceiptItem {
  name: string;
  quantity: number | null;
  unit_price: number | null;  // before discount
  discount: number | null;    // positive number
  total_price: number | null; // after discount
}

export interface ReceiptSummary {
  subtotal: number | null;
  total_item_discount: number | null;
  tax: number | null;
  service_charge: number | null;
  discount: number | null;
  total: number | null;
  paid: number | null;
  change: number | null;
  total_includes_tax: boolean | null
}

export interface ScanInput {
  buffer: Buffer;
  prompt: string;
  mimeType?: string;
}
