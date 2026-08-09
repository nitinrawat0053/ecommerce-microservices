export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  WHATSAPP = "WHATSAPP",
}

export enum NotificationType {
  ORDER_PLACED = "ORDER_PLACED",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  PAYMENT_FAILED = "PAYMENT_FAILED",
}

export interface NotificationRecipient {
  userId: string;
  name: string;
  email: string;
  phone?: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

export interface NotificationMessage {
  type: NotificationType;
  recipient: NotificationRecipient;
  channels: NotificationChannel[];
  data: Record<string, unknown>;
}