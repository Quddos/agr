import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/apiAuth";
import { forbiddenResponse } from "@/lib/auth";
import { User } from "@/models/User";

export async function PATCH(request, { params }) {
  const { error, user } = requireAuth(request);
  if (error) return error;
  if (user.role !== "admin") {
    return forbiddenResponse("Only admin can change user roles.");
  }

  try {
    const body = await request.json();
    if (!["admin", "manager", "staff"].includes(body.role)) {
      return Response.json({ message: "Invalid role." }, { status: 400 });
    }

    await connectToDatabase();
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      { role: body.role },
      { new: true }
    );

    if (!updatedUser) return Response.json({ message: "User not found." }, { status: 404 });
    return Response.json({
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch {
    return Response.json({ message: "Unable to update role." }, { status: 500 });
  }
}
