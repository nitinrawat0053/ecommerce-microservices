import { NotificationPreferences } from "./notification.types";
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  notificationPreferences: NotificationPreferences;
}