import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "@packages/config";
import { User } from "./models/user.model";

const MONGODB_URI = config.MONGODB_URI;
const EMAIL = config.SUPER_ADMIN_EMAIL;
const PASSWORD = config.SUPER_ADMIN_PASSWORD;
const NAME = config.SUPER_ADMIN_NAME;
const PHONE = config.SUPER_ADMIN_PHONE;

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
