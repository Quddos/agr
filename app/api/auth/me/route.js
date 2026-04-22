import { requireAuth } from "@/lib/apiAuth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export async function GET(request) {
  const { error, user } = requireAuth(request);
  if (error) return error;

  await connectToDatabase();
  const currentUser = await User.findById(user.id, "name email role");
  if (!currentUser) {
    return Response.json({ message: "User not found." }, { status: 404 });
  }

  return Response.json({
    user: {
      id: currentUser._id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
    },
  });
}
