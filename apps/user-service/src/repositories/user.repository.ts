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

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    const update: Record<string, string> = {};
    if (data.name) update.name = data.name.trim();
    if (data.phone) update.phone = data.phone.trim();

    return await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { returnDocument: "after", runValidators: true }
    ).select("-password");
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return await User.findByIdAndUpdate(
      userId,
      { $set: { password: hashedPassword } },
      { returnDocument: "after" }
    );
  }

  async findAddresses(userId: string) {
    const user = await User.findById(userId).select("addresses");
    return user?.addresses || [];
  }

  async addAddress(userId: string, addressData: any) {
    return await User.findByIdAndUpdate(
      userId,
      { $push: { addresses: addressData } },
      { returnDocument: "after", runValidators: true }
    ).select("-password");
  }

  async updateAddress(userId: string, addressId: string, addressData: any) {
    const setFields: Record<string, any> = {};
    for (const [key, val] of Object.entries(addressData)) {
      setFields[`addresses.$.${key}`] = val;
    }

    return await User.findOneAndUpdate(
      { _id: userId, "addresses._id": addressId },
      { $set: setFields },
      { returnDocument: "after", runValidators: true }
    ).select("-password");
  }

  async deleteAddress(userId: string, addressId: string) {
    return await User.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { _id: addressId } } },
      { returnDocument: "after" }
    ).select("-password");
  }
}
