import { connectToDatabase } from "@/lib/db";
import { forbiddenResponse } from "@/lib/auth";
import { requireAuth } from "@/lib/apiAuth";
import { canDeleteRecords } from "@/lib/permissions";
import { Crop } from "@/models/Crop";

export async function GET(request, { params }) {
  const { error } = requireAuth(request);
  if (error) return error;

  await connectToDatabase();
  const crop = await Crop.findById(params.id);
  if (!crop) return Response.json({ message: "Crop not found." }, { status: 404 });
  return Response.json({ data: crop });
}

export async function PUT(request, { params }) {
  const { error } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const quantityValue = Number(body.quantity);
    const unitPriceValue = Number(body.unitPrice);
    if (!body.name || Number.isNaN(quantityValue) || Number.isNaN(unitPriceValue)) {
      return Response.json({ message: "Missing required fields." }, { status: 400 });
    }

    await connectToDatabase();
    const crop = await Crop.findByIdAndUpdate(
      params.id,
      {
        name: body.name,
        category: body.category,
        quantity: quantityValue,
        unitPrice: unitPriceValue,
        notes: body.notes,
        imageUrl: body.imageUrl || "",
        detectionLabel: body.detectionLabel || "",
        detectionRawLabel: body.detectionRawLabel || "",
        detectionConfidence: Number(body.detectionConfidence) || 0,
        detectionStatus: body.detectionStatus || "unreviewed",
      },
      { new: true, runValidators: true }
    );

    if (!crop) return Response.json({ message: "Crop not found." }, { status: 404 });
    return Response.json({ data: crop });
  } catch {
    return Response.json({ message: "Unable to update crop." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error, user } = requireAuth(request);
  if (error) return error;
  if (!canDeleteRecords(user.role)) {
    return forbiddenResponse("Only admin or manager can delete records.");
  }

  await connectToDatabase();
  const crop = await Crop.findByIdAndDelete(params.id);
  if (!crop) return Response.json({ message: "Crop not found." }, { status: 404 });
  return Response.json({ message: "Crop deleted." });
}
