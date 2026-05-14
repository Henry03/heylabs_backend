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

export const getTracking =
  async (trackingNumber: string, courier: string) => {
    const url = 
      `https://api.binderbyte.com/v1/track` +
      `?api_key=${process.env.BINDERBYTE_API_KEY}` +
      `&courier=${courier}` +
      `&awb=${trackingNumber}` +
      `&number=89153`;

    const response =
      await axios.get(url);

    return response.data;
  }