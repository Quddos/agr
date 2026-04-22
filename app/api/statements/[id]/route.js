import { connectToDatabase } from "@/lib/db";
import { forbiddenResponse } from "@/lib/auth";
import { requireAuth } from "@/lib/apiAuth";
import { Statement } from "@/models/Statement";

export async function PUT(request, { params }) {
  const { error } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    await connectToDatabase();
    const statement = await Statement.findByIdAndUpdate(
      params.id,
      {
        type: body.type,
        amount: Number(body.amount),
        note: body.note,
        date: body.date ? new Date(body.date) : new Date(),
        crop: body.crop || null,
      },
      { new: true, runValidators: true }
    );

    if (!statement) return Response.json({ message: "Statement not found." }, { status: 404 });
    return Response.json({ data: statement });
  } catch {
    return Response.json({ message: "Unable to update statement." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error, user } = requireAuth(request);
  if (error) return error;
  if (user.role !== "admin" && user.role !== "manager") {
    return forbiddenResponse("Only admin or manager can delete statements.");
  }

  await connectToDatabase();
  const statement = await Statement.findByIdAndDelete(params.id);
  if (!statement) return Response.json({ message: "Statement not found." }, { status: 404 });
  return Response.json({ message: "Statement deleted." });
}
