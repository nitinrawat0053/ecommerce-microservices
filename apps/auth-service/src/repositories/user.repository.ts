import { User, IUser } from "../models/user.model";

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async findByPhone(phone: string): Promise<IUser | null> {
  return User.findOne({ phone });
}

 async deleteById(id: string): Promise<void> {
  await User.findByIdAndDelete(id);
}
}