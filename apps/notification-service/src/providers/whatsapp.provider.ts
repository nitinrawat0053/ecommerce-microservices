// import { NotificationProvider } from "./notification.provider";

// export class WhatsAppProvider implements NotificationProvider {
//   async send(
//     recipient: string,
//     message: string
//   ): Promise<void> {
//     console.log(`💬 Whatsapp → ${recipient}`);
//     console.log(`Message: ${message}`);

//     // Real whatsapp provider will be connected later
//   }
// }

import { NotificationProvider } from "./notification.provider";
import { config } from "@packages/config";

export class WhatsAppProvider
  implements NotificationProvider {

  async send(
    recipient: string,
    message: string
  ): Promise<void> {

    if (config.LOAD_TEST) {
      console.log(
        `🧪 MOCK WHATSAPP → ${recipient}`
      );

      return;
    }

    console.log(
      `💬 Whatsapp → ${recipient}`
    );

    console.log(
      `Message: ${message}`
    );

    // Real WhatsApp provider will be connected later
  }
}