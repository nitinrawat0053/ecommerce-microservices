import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  role: "USER" | "ADMIN";
  phone: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    phone: {
     type: String,
     required: true,
},

notificationPreferences: {
  email: {
    type: Boolean,
    default: true,
  },
  sms: {
    type: Boolean,
    default: true,
  },
  whatsapp: {
    type: Boolean,
    default: true,
  },
},
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", userSchema);