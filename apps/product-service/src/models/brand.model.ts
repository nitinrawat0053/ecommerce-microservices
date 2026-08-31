import mongoose, { Schema, Document } from "mongoose";

export interface IBrand extends Document {
  name: string;
  description?: string;
  logo?: string;
}

const brandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
    },
    logo: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

brandSchema.index({ name: 1 });

export const Brand = mongoose.model<IBrand>(
  "Brand",
  brandSchema
);
