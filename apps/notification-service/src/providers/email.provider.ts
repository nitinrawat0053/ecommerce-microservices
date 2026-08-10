import { NotificationProvider } from "./notification.provider";

export class EmailProvider implements NotificationProvider {
  async send(
    recipient: string,
    message: string
  ): Promise<void> {
    console.log(`📧 Email → ${recipient}`);
    console.log(`Message: ${message}`);

    // Real email provider will be connected later
  }
}