import mongoose, { Document, Schema } from "mongoose";

// Minimal read-only view of the shared "users" collection so this service can
// independently verify a user's phone-verification state before creating an
// order (which triggers payment-session creation). Kept intentionally slim;
// full user management lives in auth-service / user-service.
export interface IUser extends Document {
  name: string;
  email: string;
  isVerified: boolean;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["USER", "ADMIN", "SUPER_ADMIN"],
      default: "USER",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
