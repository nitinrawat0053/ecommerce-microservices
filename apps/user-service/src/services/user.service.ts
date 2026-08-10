import { NotFoundError } from "@packages/errors";
import { UserRepository } from "../repositories/user.repository";

const userRepository = new UserRepository();

export class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  notificationPreferences: user.notificationPreferences,
};

  }
  async updateNotificationPreferences(
  userId: string,
  preferences: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
  }
) {
  const user =
    await userRepository.updateNotificationPreferences(
      userId,
      preferences
    );

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}
}