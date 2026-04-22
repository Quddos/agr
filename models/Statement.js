import mongoose from "mongoose";

const statementSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: "Crop", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Statement =
  mongoose.models.Statement || mongoose.model("Statement", statementSchema);
