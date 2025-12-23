import { log } from '@/lib/utils/productionLogger';

export class TelegramBotService {
    /**
     * Send a message to the admin via Telegram Bot
     * @param message The text message to send
     */
    static async sendAlert(message: string): Promise<boolean> {
        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;

            if (!token || !chatId) {
                log.warn('⚠️ Telegram Alert Skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in .env');
                return false;
            }

            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            const body = {
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown' // Allows bold/italic
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (data.ok) {
                log.info('✅ Telegram Alert Sent successfully');
                return true;
            } else {
                log.error('❌ Telegram Alert Failed:', data);
                return false;
            }
        } catch (error) {
            log.error('❌ Telegram Alert Error:', error);
            return false;
        }
    }
}
