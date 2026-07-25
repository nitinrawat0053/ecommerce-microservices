import { User } from "../models/user.model";

export class UserRepository {
  async findById(userId: string) {
    return await User.findById(userId);
  }
}