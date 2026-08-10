export interface NotificationProvider {
  send(
    recipient: string,
    message: string
  ): Promise<void>;
}