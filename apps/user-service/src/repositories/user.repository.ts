import { User } from "../models/user.model";

export class UserRepository {
  async findById(userId: string) {
    return await User.findById(userId);
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: {
      email?: boolean;
      sms?: boolean;
      whatsapp?: boolean;
    }
  ) {
    const updateFields: Record<string, boolean> = {};

    if (preferences.email !== undefined) {
      updateFields["notificationPreferences.email"] =
        preferences.email;
    }

    if (preferences.sms !== undefined) {
      updateFields["notificationPreferences.sms"] =
        preferences.sms;
    }

    if (preferences.whatsapp !== undefined) {
      updateFields["notificationPreferences.whatsapp"] =
        preferences.whatsapp;
    }

    return await User.findByIdAndUpdate(
      userId,
      {
        $set: updateFields,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );
  }
}