import { User } from "../models/user.model";

export class UserRepository {
  async findById(userId: string) {
    return await User.findById(userId);
  }

  async findByEmail(email: string) {
    return await User.findOne({ email });
  }

  async findAll(options: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 50 } = options;
    
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateRole(userId: string, role: string) {
    return await User.findByIdAndUpdate(
      userId,
      { role },
      { returnDocument: "after", runValidators: true }
    ).select("-password");
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
      updateFields["notificationPreferences.email"] = preferences.email;
    }

    if (preferences.sms !== undefined) {
      updateFields["notificationPreferences.sms"] = preferences.sms;
    }

    if (preferences.whatsapp !== undefined) {
      updateFields["notificationPreferences.whatsapp"] = preferences.whatsapp;
    }

    return await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { returnDocument: "after", runValidators: true }
    );
  }
}
