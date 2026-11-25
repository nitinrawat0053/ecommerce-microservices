import { User, IUser } from "../models/user.model";

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async findByPhone(phone: string): Promise<IUser | null> {
    if (!phone) return null;
    const clean = phone.trim();
    const withoutPlus = clean.replace(/^\+/, "");
    const withoutCountryCode = clean.replace(/^(\+91|91)/, "");
    const withPlus91 = `+91${withoutCountryCode}`;
    const with91 = `91${withoutCountryCode}`;

    const candidates = Array.from(new Set([clean, withoutPlus, withoutCountryCode, withPlus91, with91]));

    return User.findOne({ phone: { $in: candidates } });
  }

  async deleteById(id: string): Promise<void> {
    await User.findByIdAndDelete(id);
  }

  async updatePassword(
    email: string,
    hashedPassword: string
  ): Promise<void> {
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );
  }
}
