import bcrypt from "bcryptjs";
import { ConflictError,UnauthorizedError } from "@packages/errors";
import { UserRepository } from "../repositories/user.repository";
import {generateToken} from "@packages/jwt";

const userRepository = new UserRepository();

export class AuthService {
  async register(name: string, email: string, password: string) {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    return user;
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