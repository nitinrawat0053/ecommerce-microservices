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

  let otpSent = false;
  let otpError = "";
  try {
    const formattedPhone = phone.startsWith("+")
      ? phone
      : `+91${phone}`;
    await this.twilioVerifyProvider.sendVerificationCode(formattedPhone);
    otpSent = true;
  } catch (error: any) {
    console.error(`[Auth Service] OTP send failed for ${phone}:`, error.message || error);
    otpError = error.message || "Failed to send OTP";
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isVerified: user.isVerified,
    otpSent,
    otpError: otpSent ? undefined : otpError,
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
   const formattedPhone = phone.startsWith("+")
    ? phone
    : `+91${phone}`;

  const isVerified =
    await this.twilioVerifyProvider.verifyCode(
      formattedPhone,
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

  async resendOtp(phone: string) {
  const user = await userRepository.findByPhone(phone);
  if (!user) {
    throw new UnauthorizedError("User not found");
  }
  if (user.isVerified) {
    throw new ConflictError("Phone number already verified");
  }
  const formattedPhone = phone.startsWith("+")
    ? phone
    : `+91${phone}`;
  await this.twilioVerifyProvider.sendVerificationCode(formattedPhone);
  return { message: "OTP resent successfully" };
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
      isVerified: user.isVerified,
      phone: user.phone,
    },
   };
 }
}