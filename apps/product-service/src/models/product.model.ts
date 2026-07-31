import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
     type: String,
     required: true,
     trim: true,
},

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      required: true,
      lowercase: true,

    },

    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
 // Single field indexes
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

export const Product = mongoose.model<IProduct>(
  "Product",
  productSchema
);