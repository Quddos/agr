import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return Response.json({ message: "Missing required fields." }, { status: 400 });
    }

    await connectToDatabase();
    const usersCount = await User.countDocuments();
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return Response.json({ message: "Email already in use." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const safeRole = usersCount === 0 ? "admin" : role === "manager" ? "manager" : "staff";

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: safeRole,
    });

    const token = signToken({ id: user._id.toString(), role: user.role, email: user.email });

    return Response.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return Response.json({ message: "Registration failed." }, { status: 500 });
  }
}
