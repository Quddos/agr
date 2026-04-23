import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/apiAuth";
import { forbiddenResponse } from "@/lib/auth";
import { canChangeRole } from "@/lib/permissions";
import { Settings } from "@/models/Settings";

const DEFAULTS = {
  aiThreshold: 75,
  cropMap: [
    { keywords: ["corn", "maize"], label: "Maize" },
    { keywords: ["wheat"], label: "Wheat" },
    { keywords: ["tomato"], label: "Tomato" },
    { keywords: ["banana"], label: "Banana" },
    { keywords: ["potato"], label: "Potato" },
    { keywords: ["rice"], label: "Rice" },
  ],
};

export async function GET(request) {
  const { error } = requireAuth(request);
  if (error) return error;

  await connectToDatabase();
  const doc =
    (await Settings.findOne({ key: "ai" })) ||
    (await Settings.create({ key: "ai", ...DEFAULTS }));

  return Response.json({
    data: {
      aiThreshold: doc.aiThreshold ?? DEFAULTS.aiThreshold,
      cropMap: doc.cropMap?.length ? doc.cropMap : DEFAULTS.cropMap,
    },
  });
}

export async function PUT(request) {
  const { error, user } = requireAuth(request);
  if (error) return error;
  if (!canChangeRole(user.role)) {
    return forbiddenResponse("Only admin can update AI settings.");
  }

  try {
    const body = await request.json();
    const aiThreshold = Number(body.aiThreshold);
    const cropMap = Array.isArray(body.cropMap) ? body.cropMap : null;

    if (Number.isNaN(aiThreshold) || aiThreshold < 0 || aiThreshold > 100) {
      return Response.json({ message: "Invalid aiThreshold." }, { status: 400 });
    }
    if (!cropMap) {
      return Response.json({ message: "Invalid cropMap format." }, { status: 400 });
    }

    const normalizedMap = cropMap
      .map((item) => ({
        label: String(item.label || "").trim(),
        keywords: Array.isArray(item.keywords)
          ? item.keywords.map((k) => String(k || "").trim()).filter(Boolean)
          : [],
      }))
      .filter((item) => item.label && item.keywords.length);

    await connectToDatabase();
    const doc = await Settings.findOneAndUpdate(
      { key: "ai" },
      { key: "ai", aiThreshold, cropMap: normalizedMap },
      { new: true, upsert: true }
    );

    return Response.json({
      data: { aiThreshold: doc.aiThreshold, cropMap: doc.cropMap },
    });
  } catch {
    return Response.json({ message: "Unable to save AI settings." }, { status: 500 });
  }
}

