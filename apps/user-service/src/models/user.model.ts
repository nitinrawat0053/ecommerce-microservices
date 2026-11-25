import mongoose, { Document, Schema } from "mongoose";

export interface IAddress {
  _id?: any;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  phone: string;
  addresses?: IAddress[];
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
      enum: ["USER", "ADMIN", "SUPER_ADMIN"],
      default: "USER",
    },

    phone: {
     type: String,
     required: true,
},

    addresses: [
      {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        postalCode: { type: String, required: true, trim: true },
        country: { type: String, default: "India", trim: true },
        isDefault: { type: Boolean, default: false },
      },
    ],

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