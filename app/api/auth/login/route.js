import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { makeAuthCookie, signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ message: "Missing credentials." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return Response.json({ message: "Invalid credentials." }, { status: 401 });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return Response.json({ message: "Invalid credentials." }, { status: 401 });

    const token = signToken({ id: user._id.toString(), role: user.role, email: user.email });

    return new Response(
      JSON.stringify({
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": makeAuthCookie(token),
        },
      }
    );
  } catch {
    return Response.json({ message: "Login failed." }, { status: 500 });
  }
}
