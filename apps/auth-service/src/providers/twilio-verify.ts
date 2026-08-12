import twilio from "twilio";
import { config } from "@packages/config";

const twilioClient = twilio(
  config.TWILIO_ACCOUNT_SID,
  config.TWILIO_AUTH_TOKEN
);

export class TwilioVerifyProvider {
  async sendVerificationCode(phone: string): Promise<void> {
    await twilioClient.verify.v2
      .services(config.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    console.log(`📱 Verification OTP sent → ${phone}`);
  }

  async verifyCode(
    phone: string,
    code: string
  ): Promise<boolean> {
    const verificationCheck =
      await twilioClient.verify.v2
        .services(config.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: phone,
          code,
        });

    console.log(
      `🔐 OTP verification status → ${verificationCheck.status}`
    );

    return verificationCheck.status === "approved";
  }
}