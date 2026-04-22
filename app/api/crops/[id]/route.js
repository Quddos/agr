import { connectToDatabase } from "@/lib/db";
import { forbiddenResponse } from "@/lib/auth";
import { requireAuth } from "@/lib/apiAuth";
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
    await connectToDatabase();
    const crop = await Crop.findByIdAndUpdate(
      params.id,
      {
        name: body.name,
        category: body.category,
        quantity: Number(body.quantity),
        unitPrice: Number(body.unitPrice),
        notes: body.notes,
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
  if (user.role !== "admin" && user.role !== "manager") {
    return forbiddenResponse("Only admin or manager can delete records.");
  }

  await connectToDatabase();
  const crop = await Crop.findByIdAndDelete(params.id);
  if (!crop) return Response.json({ message: "Crop not found." }, { status: 404 });
  return Response.json({ message: "Crop deleted." });
}
