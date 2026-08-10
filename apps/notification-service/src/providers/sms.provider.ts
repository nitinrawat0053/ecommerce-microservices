import { NotificationProvider } from "./notification.provider";

export class SmsProvider implements NotificationProvider {
  async send(
    recipient: string,
    message: string
  ): Promise<void> {
    console.log(`📱 SMS → ${recipient}`);
    console.log(`Message: ${message}`);

    // Real sms provider will be connected later
  }
}