import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/apiAuth";
import { forbiddenResponse } from "@/lib/auth";
import { canChangeRole, canManageUsers } from "@/lib/permissions";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET(request) {
  const { error, user } = requireAuth(request);
  if (error) return error;
  if (!canManageUsers(user.role)) {
    return forbiddenResponse("Only admin or manager can view users.");
  }

  await connectToDatabase();
  const users = await User.find({}, "name email role createdAt").sort({ createdAt: -1 });
  return Response.json({ data: users });
}

export async function POST(request) {
  const { error, user } = requireAuth(request);
  if (error) return error;
  if (!canChangeRole(user.role)) {
    return forbiddenResponse("Only admin can create users.");
  }

  try {
    const body = await request.json();
    const { name, email, password, role } = body;
    if (!name || !email || !password) {
      return Response.json({ message: "Missing required fields." }, { status: 400 });
    }
    if (!["admin", "manager", "staff"].includes(role)) {
      return Response.json({ message: "Invalid role." }, { status: 400 });
    }

    await connectToDatabase();
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return Response.json({ message: "User with email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
    });

    return Response.json(
      { data: { id: created._id, name: created.name, email: created.email, role: created.role } },
      { status: 201 }
    );
  } catch {
    return Response.json({ message: "Unable to create user." }, { status: 500 });
  }
}
