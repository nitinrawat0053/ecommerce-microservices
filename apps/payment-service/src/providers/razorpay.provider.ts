// import Razorpay from "razorpay";
// import { config } from "@packages/config";
// import crypto from "crypto";

// const razorpay = new Razorpay({
//   key_id: config.RAZORPAY_KEY_ID,
//   key_secret: config.RAZORPAY_KEY_SECRET,
// });

// export const razorpayProvider = {
//   async createOrder(
//     amount: number,
//     currency: string,
//     receipt: string
//   ) {
//     return razorpay.orders.create({
//       amount: amount * 100,
//       currency,
//       receipt,
//     });
//   },
   
//   verifyPaymentSignature(
//   razorpayOrderId: string,
//   razorpayPaymentId: string,
//   razorpaySignature: string
// ) {
//   const generatedSignature = crypto
//     .createHmac(
//       "sha256",
//       config.RAZORPAY_KEY_SECRET
//     )
//     .update(
//       `${razorpayOrderId}|${razorpayPaymentId}`
//     )
//     .digest("hex");

//   const expected = Buffer.from(generatedSignature, "hex");
//   const received = Buffer.from(razorpaySignature, "hex");

//   if (expected.length !== received.length) {
//     return false;
//   }

//   return crypto.timingSafeEqual(expected, received);
// },
import Razorpay from "razorpay";
import { config } from "@packages/config";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

export const razorpayProvider = {
  async createOrder(
    amount: number,
    currency: string,
    receipt: string
  ) {
    // 🧪 Load-test mode: NEVER call Razorpay
    if (config.LOAD_TEST) {
      console.log("🧪 MOCK RAZORPAY: createOrder");

      return {
        id: `order_mock_${crypto.randomUUID()}`,
        amount: amount * 100,
        currency,
        receipt,
        status: "created",
      };
    }

    // 💳 Normal mode: real Razorpay
    return razorpay.orders.create({
      amount: amount * 100,
      currency,
      receipt,
    });
  },

  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    // 🧪 Load-test mode: NEVER call Razorpay
    if (config.LOAD_TEST) {
      console.log("🧪 MOCK RAZORPAY: verifyPaymentSignature");

      return true;
    }

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        config.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpayOrderId}|${razorpayPaymentId}`
      )
      .digest("hex");

    return generatedSignature === razorpaySignature;
  },
  verifyWebhookSignature(
  rawBody: Buffer,
  razorpaySignature: string
) {
  const expectedSignature = crypto
    .createHmac(
      "sha256",
      config.RAZORPAY_WEBHOOK_SECRET
    )
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(razorpaySignature, "hex");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    expected,
    received
  );
}
};