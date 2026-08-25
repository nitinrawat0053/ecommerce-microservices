import { NotificationProvider } from "./notification.provider";
import { resend } from "./resend";
import { config } from "@packages/config";

export class EmailProvider implements NotificationProvider {
  async send(
    recipient: string,
    message: string,
    subject?: string,
    html?: string
  ): Promise<void> {
    console.log(`📧 Sending email → ${recipient}`);

    // 🧪 Load-test mode
    if (config.LOAD_TEST) {
      console.log(`🧪 MOCK EMAIL → ${recipient}`);
      return;
    }

    // 📧 Real Resend API — use rich HTML if provided, else plain message
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: recipient,
      subject: subject || "E-commerce Notification",
      html: html || `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #ffffff;">
          <p style="font-size: 15px; color: #333; line-height: 1.6;">${message}</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`✅ Email sent → ${recipient}`);
  }
}
// import { NotificationProvider } from "./notification.provider";
// import { resend } from "./resend";
// import { config } from "@packages/config";

// export class EmailProvider implements NotificationProvider {
//   async send(
//     recipient: string,
//     message: string
//   ): Promise<void> {
//     console.log(`📧 Sending email → ${recipient}`);

//     // 🧪 Load-test mode
//     if (config.LOAD_TEST) {
//       console.log(
//         `🧪 MOCK EMAIL → ${recipient}`
//       );

//       return;
//     }

//     // 📧 Real Resend API
//     const { error } = await resend.emails.send({
//       from: "onboarding@resend.dev",
//       to: recipient,
//       subject: "E-commerce Notification",
//       html: `
//         <h2>E-commerce Notification</h2>
//         <p>${message}</p>
//       `,
//     });

//     if (error) {
//       throw new Error(
//         `Failed to send email: ${error.message}`
//       );
//     }

//     console.log(`✅ Email sent → ${recipient}`);
//   }
// }
