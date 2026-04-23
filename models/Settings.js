import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    aiThreshold: { type: Number, default: 75, min: 0, max: 100 },
    cropMap: {
      type: [
        {
          keywords: { type: [String], default: [] },
          label: { type: String, default: "" },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Settings =
  mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
