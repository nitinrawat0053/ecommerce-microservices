import { NotificationProvider } from "./notification.provider";

export class WhatsAppProvider implements NotificationProvider {
  async send(
    recipient: string,
    message: string
  ): Promise<void> {
    console.log(`💬 Whatsapp → ${recipient}`);
    console.log(`Message: ${message}`);

    // Real whatsapp provider will be connected later
  }
}