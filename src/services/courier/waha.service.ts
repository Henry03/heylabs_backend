import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import path from "path";

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

export async function sendWhatsappDocument(
    chatId: string,
    filePath: string,
    caption: string
) {
console.log("Sending document to WhatsApp...");
const response = await axios.post(
    `${process.env.WAHA_URL}/api/sendFile`,
    {
        chatId,

        session: "default",

        caption,

        file: {
            filename: path.basename(filePath),
            mimetype: "application/pdf",
            url: `${process.env.PUBLIC_URL}/generatedReport/${path.basename(filePath)}`
        }
    },
    {
        headers: {
            "X-Api-Key": process.env.WAHA_API_KEY,
            "Content-Type": "application/json"
        }
    }
);

}