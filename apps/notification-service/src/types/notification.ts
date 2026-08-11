export interface EmailNotification {
  type: "EMAIL";
  to: string;
  subject: string;
  html: string;
}