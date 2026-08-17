import { Request, Response } from 'express';
import { TelegramUpdate } from '../interfaces/telegram.interface';

export const TelegramWebhook = async (
    req: Request<{}, {}, TelegramUpdate>, 
    res: Response
): Promise<Response> => {
    try {
        const update = req.body;

        if (update.message?.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;

            console.log(`[Telegram Update] Chat ID: ${chatId} | Message: ${text}`);

            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            if (botToken) {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `Received: ${text}`,
                    }),
                });
            }
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error('Error in TelegramWebhook controller:', error);
        return res.sendStatus(200);
    }
}
