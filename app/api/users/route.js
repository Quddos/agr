import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/apiAuth";
import { forbiddenResponse } from "@/lib/auth";
import { User } from "@/models/User";

export async function GET(request) {
  const { error, user } = requireAuth(request);
  if (error) return error;
  if (user.role !== "admin" && user.role !== "manager") {
    return forbiddenResponse("Only admin or manager can view users.");
  }

  await connectToDatabase();
  const users = await User.find({}, "name email role createdAt").sort({ createdAt: -1 });
  return Response.json({ data: users });
}
