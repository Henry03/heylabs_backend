import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';
import readline from 'readline';
import dotenv from 'dotenv';
import { sendWhatsappMessage } from './courier/waha.service';

dotenv.config();

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH || '';
const stringSession = new StringSession(process.env.TELEGRAM_SESSION_STRING || '');
const keywords = ["deposit", "komisi", "transfer"];
const ALLOWED_SENDER_IDS = ["1562376617", "5613877073"];
const grupIsiPulsa = "120363411427876906@g.us";

// Native readline prompt helper
const prompt = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
};

export const startTelegramClient = async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('Connecting to Telegram...');

  // Start client with dynamic fallback callbacks
  await client.start({
    phoneNumber: async () => await prompt('Enter your phone number (e.g. +628123456789): '),
    password: async () => await prompt('Enter 2FA password (if enabled): '),
    phoneCode: async () => await prompt('Enter the code you received from Telegram: '),
    onError: (err) => console.error('Telegram Auth Error:', err),
  });

  // Verify if session is authorized
  const isAuthorized = await client.checkAuthorization();

  if (isAuthorized) {
    console.log('Telegram Userbot successfully connected!');
    
    // Save or update session string
    const sessionString = client.session.save() as unknown as string;
    if (!process.env.TELEGRAM_SESSION_STRING) {
      console.log('\n--- NEW SESSION GENERATED ---');
      console.log('Save this in your .env as TELEGRAM_SESSION_STRING:');
      console.log(sessionString);
      console.log('-----------------------------\n');
    }
  } else {
    console.error('Failed to authorize Telegram session.');
    return;
  }

  // Handle incoming messages
  client.addEventHandler(async (event) => {
    const message = event.message;
    const senderId = message?.senderId?.toString() || '';
    if (message && !message.out && ALLOWED_SENDER_IDS.includes(senderId) && keywords.some(keyword => message.text?.toLowerCase().includes(keyword))) {
        console.log(`[Personal Account] ${senderId}: ${message.text}`);
        await sendWhatsappMessage(
            grupIsiPulsa,
            message.text || ''
        );
    }
  }, new NewMessage({}));
};

// Auto-run if executed directly
if (require.main === module) {
  startTelegramClient();
}