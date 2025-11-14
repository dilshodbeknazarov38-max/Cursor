import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMessage(message: string) {
    const botToken = this.configService.get<string>('app.telegram.botToken');
    const chatId = this.configService.get<string>('app.telegram.chatId');

    if (!botToken || !chatId) {
      return;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(
          `Telegram notification failed: ${response.status} ${text}`,
        );
      }
    } catch (error) {
      this.logger.error('Telegram notification error', error instanceof Error ? error.stack : undefined);
    }
  }
}
