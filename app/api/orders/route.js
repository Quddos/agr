import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/apiAuth";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";

export async function GET(request) {
  const { error, user } = requireAuth(request);
  if (error) return error;

  await connectToDatabase();

  if (user.role === "admin" || user.role === "manager") {
    const orders = await Order.find().sort({ createdAt: -1 });
    return Response.json({ data: orders });
  }

  const orders = await Order.find({ userId: user.id }).sort({ createdAt: -1 });
  return Response.json({ data: orders });
}

export async function POST(request) {
  const { error, user } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const paymentMethod = body.paymentMethod;
    const shipping = body.shipping || {};
    const items = Array.isArray(body.items) ? body.items : [];

    if (!["cod", "online"].includes(paymentMethod)) {
      return Response.json({ message: "Invalid payment method." }, { status: 400 });
    }
    if (!shipping.fullName || !shipping.phone || !shipping.address) {
      return Response.json({ message: "Missing shipping details." }, { status: 400 });
    }
    if (items.length === 0) {
      return Response.json({ message: "Cart is empty." }, { status: 400 });
    }

    await connectToDatabase();

    // Re-price from database and decrement stock.
    const orderItems = [];
    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return Response.json({ message: "Invalid product in cart." }, { status: 400 });
      }
      const qty = Number(item.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        return Response.json({ message: "Invalid quantity." }, { status: 400 });
      }
      if (product.stock < qty) {
        return Response.json({ message: `Insufficient stock for ${product.name}.` }, { status: 400 });
      }

      product.stock -= qty;
      await product.save();

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: qty,
        imageUrl: product.imageUrl || "",
      });
      subtotal += product.price * qty;
    }

    const deliveryFee = subtotal > 0 ? 0 : 0;
    const total = subtotal + deliveryFee;

    const order = await Order.create({
      userId: user.id,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "online" ? "paid" : "pending",
      orderStatus: "placed",
      shipping: {
        fullName: shipping.fullName,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city || "",
      },
    });

    return Response.json({ data: order }, { status: 201 });
  } catch {
    return Response.json({ message: "Unable to place order." }, { status: 500 });
  }
}

