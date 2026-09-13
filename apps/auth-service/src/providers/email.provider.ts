import { Resend } from "resend";
import { config } from "@packages/config";

const resend = new Resend(config.RESEND_API_KEY);

/**
 * Send an OTP email for password reset.
 * In LOAD_TEST mode, logs the OTP to console instead of sending.
 */
export async function sendOtpEmail(
  to: string,
  otp: string
): Promise<void> {
  if (config.LOAD_TEST) {
    console.log(`🧪 [LOAD_TEST] Password reset OTP for ${to}: ${otp}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject: "Reset your password — ShopMicro",
    html: buildOtpEmail(otp),
  });

  if (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }

  console.log(`📧 Password reset OTP sent → ${to}`);
}

function buildOtpEmail(otp: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 40px;border-bottom:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:20px;font-weight:700;color:#2563eb;letter-spacing:-0.3px;">
                    🛒 ShopMicro
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              <h1 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 12px 0;line-height:1.3;">
                Reset your password
              </h1>
              <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 28px 0;">
                We received a request to reset your password. Use the verification code below within <strong>5 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="background-color:#f0f9ff;border:2px dashed #2563eb;border-radius:8px;padding:20px 40px;text-align:center;">
                    <p style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;font-weight:600;">
                      Your verification code
                    </p>
                    <p style="font-size:32px;font-weight:700;color:#111827;letter-spacing:6px;margin:0;font-family:monospace;">
                      ${otp}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 8px 0;">
                This code will expire in 5 minutes. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0;">
                If you have any questions, reply to this email or contact us at
                <a href="mailto:support@shopmicro.com" style="color:#6b7280;text-decoration:underline;">support@shopmicro.com</a>
              </p>
              <p style="font-size:11px;color:#d1d5db;margin:12px 0 0 0;">
                © ${new Date().getFullYear()} ShopMicro. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
