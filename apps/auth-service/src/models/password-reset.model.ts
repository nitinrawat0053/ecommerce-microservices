import mongoose, { Document, Schema } from "mongoose";

export interface IPasswordReset extends Document {
  email: string;
  otpHash: string;
  expiresAt: Date;
  used: boolean;
}

const passwordResetSchema = new Schema<IPasswordReset>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL — auto-delete after expiry
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const PasswordReset = mongoose.model<IPasswordReset>(
  "PasswordReset",
  passwordResetSchema
);
