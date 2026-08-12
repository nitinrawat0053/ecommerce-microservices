import bcrypt from "bcryptjs";
import { ConflictError,UnauthorizedError } from "@packages/errors";
import { UserRepository } from "../repositories/user.repository";
import {generateToken} from "@packages/jwt";
import { TwilioVerifyProvider } from "../providers/twilio-verify";

const userRepository = new UserRepository();

export class AuthService {
  private twilioVerifyProvider = new TwilioVerifyProvider();
  async register(name: string, email: string, password: string, phone: string) {
  const existingUser = await userRepository.findByEmail(email);
  const existingPhone = await userRepository.findByPhone(phone);

  if (existingUser || existingPhone) {
    throw new ConflictError("User already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.create({
    name,
    email,
    password: hashedPassword,
    phone,
  });

  try {
    await this.twilioVerifyProvider.sendVerificationCode(phone);
  } catch (error) {
    await userRepository.deleteById(user._id.toString());
    throw error;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isVerified: user.isVerified,
  };
}
  async verifyPhone(phone: string, code: string) {
  const user = await userRepository.findByPhone(phone);

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  if (user.isVerified) {
    throw new ConflictError("Phone number already verified");
  }

  const isVerified =
    await this.twilioVerifyProvider.verifyCode(
      phone,
      code
    );

  if (!isVerified) {
    throw new UnauthorizedError("Invalid or expired OTP");
  }

  user.isVerified = true;
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isVerified: user.isVerified,
  };
}

  async login(email: string, password: string) {
    
    const user = await userRepository.findByEmail(email);
    if (!user) {
        throw new UnauthorizedError("Invalid email or password");
    }
    
    const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
);

    if (!isPasswordCorrect) {
       throw new UnauthorizedError("Invalid email or password");
    }
    const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
});
    return {
        token,
        user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
   };
 }
}