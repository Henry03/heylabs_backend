import axios from "axios";

export const sendWhatsappMessage =
  async (
    to: string,
    message: string
  ) => {

    await axios.post(
      `${process.env.WAHA_URL}/api/sendText`,
        {  
            session: "default",
            chatId: to,
            text: message
        },
        {
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": process.env.WAHA_API_KEY
            }
        }
    );

};