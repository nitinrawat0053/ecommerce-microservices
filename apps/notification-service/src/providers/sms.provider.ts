// import { NotificationProvider } from "./notification.provider";
// import { twilioClient } from "./twilio";
// import { config } from "@packages/config";

// export class SmsProvider implements NotificationProvider {
//   async send(
//     recipient: string,
//     message: string
//   ): Promise<void> {
//     console.log(`📱 Sending SMS → ${recipient}`);

//     const response = await twilioClient.messages.create({
//       body: message,
//       from: config.TWILIO_PHONE_NUMBER,
//       to: recipient,
//     });

//     console.log(`✅ SMS sent → ${recipient}`);
//     console.log(`Twilio SID: ${response.sid}`);
//   }
// }

import { NotificationProvider } from "./notification.provider";
import { twilioClient } from "./twilio";
import { config } from "@packages/config";

export class SmsProvider implements NotificationProvider {
  async send(
    recipient: string,
    message: string
  ): Promise<void> {
    console.log(`📱 Sending SMS → ${recipient}`);

    // 🧪 Load-test mode
    if (config.LOAD_TEST) {
      console.log(
        `🧪 MOCK SMS → ${recipient}`
      );

      return;
    }

    // 📱 Real Twilio API
    const response =
      await twilioClient.messages.create({
        body: message,
        from: config.TWILIO_PHONE_NUMBER,
        to: recipient,
      });

    console.log(`✅ SMS sent → ${recipient}`);
    console.log(`Twilio SID: ${response.sid}`);
  }
}