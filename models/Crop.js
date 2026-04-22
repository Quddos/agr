import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    detectionLabel: { type: String, default: "" },
    detectionRawLabel: { type: String, default: "" },
    detectionConfidence: { type: Number, default: 0 },
    detectionStatus: {
      type: String,
      enum: ["unreviewed", "needs_review", "accepted"],
      default: "unreviewed",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Crop = mongoose.models.Crop || mongoose.model("Crop", cropSchema);
