import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { User } from "./models/user.model";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "";
const EMAIL = process.env.SUPER_ADMIN_EMAIL || "admin@shopmicro.com";
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@123";
const NAME = process.env.SUPER_ADMIN_NAME || "Super Admin";
const PHONE = process.env.SUPER_ADMIN_PHONE || "+1234567890";

async function seedSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const existingUser = await User.findOne({ email: EMAIL });

    if (existingUser) {
      console.log("Super Admin already exists. Skipping seed.");
      await mongoose.disconnect();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    const superAdmin = await User.create({
      name: NAME,
      email: EMAIL,
      password: hashedPassword,
      phone: PHONE,
      role: "SUPER_ADMIN",
      isVerified: true,
    });

    console.log("Super Admin created successfully");
    console.log("Email:", superAdmin.email);
    console.log("Role:", superAdmin.role);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Super Admin:", error);
    process.exit(1);
  }
}

seedSuperAdmin();
