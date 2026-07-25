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
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}