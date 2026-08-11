export const notificationTemplates = {
  orderPlaced: (orderId: string) =>
    `Your order ${orderId} has been placed successfully.`,

  paymentSuccess: (
    orderId: string,
    transactionId: string
  ) =>
    `Payment successful for order ${orderId}. Transaction ID: ${transactionId}.`,

  paymentFailed: (orderId: string) =>
    `Payment failed for order ${orderId}. Please try again.`,
};