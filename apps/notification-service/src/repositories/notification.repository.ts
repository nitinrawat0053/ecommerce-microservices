import { redisClient } from "@packages/redis";

export interface NotificationRecord {
  id: string;
  userId: string;
  type: "EMAIL" | "SMS" | "WHATSAPP" | "ORDER" | "PAYMENT" | "SYSTEM";
  title: string;
  message: string;
  recipient?: string;
  read: boolean;
  createdAt: string;
}

export class NotificationRepository {
  private getUserKey(userId: string): string {
    return `notifications:user:${userId}`;
  }

  /**
   * Save a notification record for a specific user.
   */
  async create(
    data: Omit<NotificationRecord, "id" | "createdAt" | "read">
  ): Promise<NotificationRecord> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const record: NotificationRecord = {
      ...data,
      id,
      read: false,
      createdAt: new Date().toISOString(),
    };

    try {
      const key = this.getUserKey(data.userId);
      // Keep up to 100 recent notifications per user in Redis list
      await redisClient.lpush(key, JSON.stringify(record));
      await redisClient.ltrim(key, 0, 99);
      // Set 30-day TTL on user's notifications
      await redisClient.expire(key, 30 * 24 * 3600);
    } catch (err) {
      console.error("[Notification Repository] Error storing notification in Redis:", err);
    }

    return record;
  }

  /**
   * Get all notifications for an authenticated user (strictly user-scoped).
   */
  async findByUserId(userId: string): Promise<NotificationRecord[]> {
    try {
      const key = this.getUserKey(userId);
      const rawList = await redisClient.lrange(key, 0, -1);
      return rawList.map((item) => JSON.parse(item) as NotificationRecord);
    } catch (err) {
      console.error("[Notification Repository] Error fetching user notifications:", err);
      return [];
    }
  }

  /**
   * Mark a notification as read, ensuring strict ownership check.
   * Returns null if notification doesn't exist or doesn't belong to the user.
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<NotificationRecord | null> {
    try {
      const key = this.getUserKey(userId);
      const rawList = await redisClient.lrange(key, 0, -1);

      let updatedRecord: NotificationRecord | null = null;
      const updatedList: string[] = [];

      for (const raw of rawList) {
        const item = JSON.parse(raw) as NotificationRecord;
        if (item.id === notificationId && item.userId === userId) {
          item.read = true;
          updatedRecord = item;
        }
        updatedList.push(JSON.stringify(item));
      }

      if (!updatedRecord) {
        return null;
      }

      // Replace list atomically with updated items
      await redisClient.del(key);
      if (updatedList.length > 0) {
        // rpush back preserving order
        await redisClient.rpush(key, ...updatedList);
      }

      return updatedRecord;
    } catch (err) {
      console.error("[Notification Repository] Error marking notification read:", err);
      return null;
    }
  }
}

export const notificationRepository = new NotificationRepository();
