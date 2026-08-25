import { emailStyles, formatINR } from './email.styles';

export interface OrderEmailData {
  customerName: string;
  orderNumber: string;
  orderId: string;
  orderItems: Array<{
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
    variant?: string;
  }>;
  subtotal: number;
  discount?: number;
  discountCode?: string;
  discountAmount?: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  shippingMethod?: string;
  shippingAddress?: string;
  billingAddress?: string;
  frontendUrl: string;
  savedAmount?: number;
  transactionId?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderOrderItems(items: OrderEmailData['orderItems']): string {
  return items.map(item => {
    const imgSrc = item.productImage
      ? escapeHtml(item.productImage)
      : 'https://placehold.co/128x128/f3f4f6/9ca3af?text=Product';
    return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width: 72px; vertical-align: top; padding-right: 16px;">
                <img
                  src="${imgSrc}"
                  alt="${escapeHtml(item.productName)}"
                  width="64"
                  height="64"
                  style="width: 64px; height: 64px; border-radius: 8px; object-fit: contain; background-color: #f9fafb; border: 1px solid #e5e7eb; display: block;"
                />
              </td>
              <td style="vertical-align: top;">
                <p style="font-size: 14px; font-weight: 500; color: #111827; margin: 0 0 4px 0; line-height: 1.3;">
                  ${escapeHtml(item.productName)}
                </p>
                ${item.variant ? `<p style="font-size: 12px; color: #9ca3af; margin: 0 0 4px 0;">${escapeHtml(item.variant)}</p>` : ''}
                <p style="font-size: 13px; color: #6b7280; margin: 0;">
                  Qty: ${item.quantity}
                </p>
              </td>
              <td style="vertical-align: top; text-align: right; white-space: nowrap;">
                <p style="font-size: 14px; font-weight: 600; color: #111827; margin: 0;">
                  ${formatINR(item.price * item.quantity)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join('');
}

function renderSummaryRows(data: OrderEmailData): string {
  let rows = '';

  rows += `
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Subtotal</td>
      <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${formatINR(data.subtotal)}</td>
    </tr>`;

  if (data.discount && data.discount > 0) {
    rows += `
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">
        Discount${data.discountCode ? ` <span style="display: inline-block; padding: 2px 8px; background-color: #fef3c7; color: #92400e; border-radius: 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px;">${escapeHtml(data.discountCode)}</span>` : ''}
      </td>
      <td style="padding: 8px 0; font-size: 14px; color: #dc2626; text-align: right;">-${formatINR(data.discount)}</td>
    </tr>`;
  }

  rows += `
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Shipping</td>
      <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${data.shipping === 0 ? 'Free' : formatINR(data.shipping)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Taxes</td>
      <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${formatINR(data.tax)}</td>
    </tr>`;

  return rows;
}

function renderOrderPlacedTemplate(data: OrderEmailData): string {
  const orderUrl = `${data.frontendUrl}/orders/${data.orderId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Order Confirmed</title>
</head>
<body style="${emailStyles.emailBody}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 24px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 24px 40px; border-bottom: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 20px; font-weight: 700; color: #2563eb; letter-spacing: -0.3px;">
                    🛒 ShopMicro
                  </td>
                  <td style="text-align: right; font-size: 13px; color: #6b7280; letter-spacing: 0.5px;">
                    ORDER #${escapeHtml(data.orderNumber)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="${emailStyles.content}">

              <!-- Thank You -->
              <h1 style="font-size: 26px; font-weight: 600; color: #111827; margin: 0 0 12px 0; line-height: 1.3;">
                Thank you for your order!
              </h1>
              <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 28px 0;">
                We're getting your order ready to be shipped. We will notify you when it has been sent.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <a href="${escapeHtml(orderUrl)}"
                       style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.3px;">
                      View your order
                    </a>
                  </td>
                  <td style="padding-left: 16px;">
                    <a href="${escapeHtml(data.frontendUrl)}"
                       style="font-size: 14px; color: #6b7280; text-decoration: underline;">
                      Visit our store
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

              <!-- Order Summary -->
              <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 20px 0;">
                Order summary
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${renderOrderItems(data.orderItems)}
              </table>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

              <!-- Pricing Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${renderSummaryRows(data)}
                <tr>
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #111827; border-top: 2px solid #111827;">Total</td>
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #111827; text-align: right; border-top: 2px solid #111827;">${formatINR(data.total)}</td>
                </tr>
              </table>

              ${data.savedAmount && data.savedAmount > 0 ? `
              <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 4px 12px; background-color: #ecfdf5; color: #059669; border-radius: 4px; font-size: 13px; font-weight: 500;">
                      🎉 You saved ${formatINR(data.savedAmount)}
                    </span>
                  </td>
                </tr>
              </table>` : ''}

            </td>
          </tr>

          <!-- Customer Information -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 32px 0;">

              <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 24px 0;">
                Customer information
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Shipping Address -->
                  <td width="50%" valign="top" style="padding-right: 24px;">
                    <p style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600;">
                      Shipping address
                    </p>
                    <p style="font-size: 14px; color: #111827; margin: 0 0 20px 0; line-height: 1.5;">
                      <strong>${escapeHtml(data.customerName)}</strong><br>
                      ${escapeHtml(data.shippingAddress || 'Not provided')}
                    </p>
                  </td>
                  <!-- Billing Address -->
                  <td width="50%" valign="top">
                    <p style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600;">
                      Billing address
                    </p>
                    <p style="font-size: 14px; color: #111827; margin: 0 0 20px 0; line-height: 1.5;">
                      <strong>${escapeHtml(data.customerName)}</strong><br>
                      ${escapeHtml(data.billingAddress || data.shippingAddress || 'Not provided')}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Payment & Shipping Method -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 24px;">
                    <p style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600;">
                      Payment
                    </p>
                    <p style="font-size: 14px; color: #111827; margin: 0;">
                      ${escapeHtml(data.paymentMethod || 'Razorpay')}
                    </p>
                  </td>
                  <td width="50%" valign="top">
                    <p style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600;">
                      Shipping method
                    </p>
                    <p style="font-size: 14px; color: #111827; margin: 0;">
                      ${escapeHtml(data.shippingMethod || 'Standard Shipping')}
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af; line-height: 1.6; margin: 0;">
                If you have any questions, reply to this email or contact us at
                <a href="mailto:support@shopmicro.com" style="color: #6b7280; text-decoration: underline;">support@shopmicro.com</a>
              </p>
              <p style="font-size: 11px; color: #d1d5db; margin: 12px 0 0 0;">
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

function renderPaymentSuccessTemplate(data: OrderEmailData): string {
  const orderUrl = `${data.frontendUrl}/orders/${data.orderId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Payment Successful</title>
</head>
<body style="${emailStyles.emailBody}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 24px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 24px 40px; border-bottom: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 20px; font-weight: 700; color: #2563eb; letter-spacing: -0.3px;">
                    🛒 ShopMicro
                  </td>
                  <td style="text-align: right; font-size: 13px; color: #6b7280; letter-spacing: 0.5px;">
                    ORDER #${escapeHtml(data.orderNumber)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="${emailStyles.content}">

              <!-- Success Badge -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="width: 48px; height: 48px; background-color: #ecfdf5; border-radius: 50%; text-align: center; vertical-align: middle; font-size: 24px; line-height: 48px;">
                    ✓
                  </td>
                </tr>
              </table>

              <h1 style="font-size: 26px; font-weight: 600; color: #111827; margin: 0 0 12px 0; line-height: 1.3;">
                Payment successful!
              </h1>
              <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 8px 0;">
                Your payment of <strong>${formatINR(data.total)}</strong> has been received successfully.
              </p>
              ${data.transactionId ? `<p style="font-size: 13px; color: #9ca3af; margin: 0 0 28px 0;">
                Transaction ID: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${escapeHtml(data.transactionId)}</code>
              </p>` : '<p style="margin: 0 0 28px 0;"></p>'}

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <a href="${escapeHtml(orderUrl)}"
                       style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.3px;">
                      View your order
                    </a>
                  </td>
                  <td style="padding-left: 16px;">
                    <a href="${escapeHtml(data.frontendUrl)}"
                       style="font-size: 14px; color: #6b7280; text-decoration: underline;">
                      Visit our store
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

              <!-- Order Summary -->
              <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 20px 0;">
                Order summary
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${renderOrderItems(data.orderItems)}
              </table>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

              <!-- Pricing Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${renderSummaryRows(data)}
                <tr>
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #111827; border-top: 2px solid #111827;">Total</td>
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #111827; text-align: right; border-top: 2px solid #111827;">${formatINR(data.total)}</td>
                </tr>
              </table>

              ${data.savedAmount && data.savedAmount > 0 ? `
              <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 4px 12px; background-color: #ecfdf5; color: #059669; border-radius: 4px; font-size: 13px; font-weight: 500;">
                      🎉 You saved ${formatINR(data.savedAmount)}
                    </span>
                  </td>
                </tr>
              </table>` : ''}

            </td>
          </tr>

          <!-- Customer Information -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 32px 0;">

              <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 24px 0;">
                Customer information
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 24px;">
                    <p style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600;">
                      Shipping address
                    </p>
                    <p style="font-size: 14px; color: #111827; margin: 0 0 20px 0; line-height: 1.5;">
                      <strong>${escapeHtml(data.customerName)}</strong><br>
                      ${escapeHtml(data.shippingAddress || 'Not provided')}
                    </p>
                  </td>
                  <td width="50%" valign="top">
                    <p style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600;">
                      Billing address
                    </p>
                    <p style="font-size: 14px; color: #111827; margin: 0 0 20px 0; line-height: 1.5;">
                      <strong>${escapeHtml(data.customerName)}</strong><br>
                      ${escapeHtml(data.billingAddress || data.shippingAddress || 'Not provided')}
                    </p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 24px;">
                    <p style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600;">
                      Payment
                    </p>
                    <p style="font-size: 14px; color: #111827; margin: 0;">
                      ${escapeHtml(data.paymentMethod || 'Razorpay')}
                    </p>
                  </td>
                  <td width="50%" valign="top">
                    <p style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600;">
                      Shipping method
                    </p>
                    <p style="font-size: 14px; color: #111827; margin: 0;">
                      ${escapeHtml(data.shippingMethod || 'Standard Shipping')}
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af; line-height: 1.6; margin: 0;">
                If you have any questions, reply to this email or contact us at
                <a href="mailto:support@shopmicro.com" style="color: #6b7280; text-decoration: underline;">support@shopmicro.com</a>
              </p>
              <p style="font-size: 11px; color: #d1d5db; margin: 12px 0 0 0;">
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

function renderPaymentFailedTemplate(data: OrderEmailData): string {
  const orderUrl = `${data.frontendUrl}/orders/${data.orderId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Payment Failed</title>
</head>
<body style="${emailStyles.emailBody}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 24px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 24px 40px; border-bottom: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 20px; font-weight: 700; color: #2563eb; letter-spacing: -0.3px;">
                    🛒 ShopMicro
                  </td>
                  <td style="text-align: right; font-size: 13px; color: #6b7280; letter-spacing: 0.5px;">
                    ORDER #${escapeHtml(data.orderNumber)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="${emailStyles.content}">

              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="width: 48px; height: 48px; background-color: #fef2f2; border-radius: 50%; text-align: center; vertical-align: middle; font-size: 24px; line-height: 48px; color: #dc2626;">
                    ✕
                  </td>
                </tr>
              </table>

              <h1 style="font-size: 26px; font-weight: 600; color: #111827; margin: 0 0 12px 0; line-height: 1.3;">
                Payment failed
              </h1>
              <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 28px 0;">
                Unfortunately, your payment could not be processed. Please try again or use a different payment method.
              </p>

              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <a href="${escapeHtml(orderUrl)}"
                       style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.3px;">
                      Retry payment
                    </a>
                  </td>
                  <td style="padding-left: 16px;">
                    <a href="${escapeHtml(data.frontendUrl)}"
                       style="font-size: 14px; color: #6b7280; text-decoration: underline;">
                      Visit our store
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af; line-height: 1.6; margin: 0;">
                If you have any questions, reply to this email or contact us at
                <a href="mailto:support@shopmicro.com" style="color: #6b7280; text-decoration: underline;">support@shopmicro.com</a>
              </p>
              <p style="font-size: 11px; color: #d1d5db; margin: 12px 0 0 0;">
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

export const emailTemplates = {
  orderPlaced: (data: OrderEmailData) => ({
    subject: `Order #${data.orderNumber} confirmed — ShopMicro`,
    html: renderOrderPlacedTemplate(data),
  }),

  paymentSuccess: (data: OrderEmailData) => ({
    subject: `Payment received for order #${data.orderNumber} — ShopMicro`,
    html: renderPaymentSuccessTemplate(data),
  }),

  paymentFailed: (data: OrderEmailData) => ({
    subject: `Payment failed for order #${data.orderNumber} — ShopMicro`,
    html: renderPaymentFailedTemplate(data),
  }),
};