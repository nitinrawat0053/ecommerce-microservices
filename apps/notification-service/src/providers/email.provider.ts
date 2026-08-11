import { NotificationProvider } from "./notification.provider";
import { resend } from "./resend";

export class EmailProvider implements NotificationProvider {
  async send(
    recipient: string,
    message: string
  ): Promise<void> {
    console.log(`📧 Sending email → ${recipient}`);

    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: recipient,
      subject: "E-commerce Notification",
      html: `
        <h2>E-commerce Notification</h2>
        <p>${message}</p>
      `,
    });

    if (error) {
      throw new Error(
        `Failed to send email: ${error.message}`
      );
    }

    console.log(`✅ Email sent → ${recipient}`);
  }
}