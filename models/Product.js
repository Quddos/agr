import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

