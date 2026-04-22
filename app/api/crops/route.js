import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/apiAuth";
import { Crop } from "@/models/Crop";

export async function GET(request) {
  const { error } = requireAuth(request);
  if (error) return error;

  await connectToDatabase();
  const crops = await Crop.find().sort({ createdAt: -1 });
  return Response.json({ data: crops });
}

export async function POST(request) {
  const { error, user } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, category, quantity, unitPrice, notes } = body;

    if (!name || quantity === undefined || unitPrice === undefined) {
      return Response.json({ message: "Missing required fields." }, { status: 400 });
    }

    await connectToDatabase();
    const crop = await Crop.create({
      name,
      category,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      notes,
      createdBy: user.id,
    });

    return Response.json({ data: crop }, { status: 201 });
  } catch {
    return Response.json({ message: "Unable to create crop." }, { status: 500 });
  }
}
