import axios from "axios";

export const getSPXTracking =
  async (trackingNumber: string) => {

    const url =
      `https://spx.co.id/shipment/order/open/order/get_order_info` +
      `?spx_tn=${trackingNumber}` +
      `&language_code=id`;

    const response =
      await axios.get(url);

    return response.data;

  };