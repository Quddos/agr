import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/apiAuth";
import { forbiddenResponse } from "@/lib/auth";

export async function GET() {
  await connectToDatabase();
  const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
  return Response.json({ data: products });
}

export async function POST(request) {
  const { error, user } = requireAuth(request);
  if (error) return error;
  if (user.role !== "admin") return forbiddenResponse("Only admin can create products.");

  try {
    const body = await request.json();
    const price = Number(body.price);
    const stock = Number(body.stock);
    if (!body.name || Number.isNaN(price) || Number.isNaN(stock)) {
      return Response.json({ message: "Missing required fields." }, { status: 400 });
    }

    await connectToDatabase();
    const product = await Product.create({
      name: body.name,
      category: body.category || "General",
      description: body.description || "",
      price,
      stock,
      imageUrl: body.imageUrl || "",
      isActive: body.isActive !== false,
    });

    return Response.json({ data: product }, { status: 201 });
  } catch {
    return Response.json({ message: "Unable to create product." }, { status: 500 });
  }
}

