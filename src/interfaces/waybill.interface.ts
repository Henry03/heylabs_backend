export type ParsedItem = {
  name: string;
  variation?: string;
  quantity: number;
  price: number;
  discount: number
};

export type ParsedOrder = {

  storeName: string;

  trackingNumber?: string;
  courier?: string;

  items: ParsedItem[];

  subtotalProduct: number;
  shippingCost: number;
  shippingDiscount: number;
  voucher: number;
  serviceFee: number;
  totalAmount: number;

};

export type ParseResult =
  | {
      success: true;
      data: ParsedOrder;
    }
  | {
      success: false;
      errors: string[];
    };