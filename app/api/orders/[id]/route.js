import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/apiAuth";
import { forbiddenResponse } from "@/lib/auth";
import { Order } from "@/models/Order";

export async function PATCH(request, { params }) {
  const { error, user } = requireAuth(request);
  if (error) return error;
  if (user.role !== "admin" && user.role !== "manager") {
    return forbiddenResponse("Only admin or manager can update order status.");
  }

  try {
    const body = await request.json();
    const allowedStatus = ["placed", "processing", "delivered", "cancelled"];
    const allowedPayment = ["pending", "paid"];

    const update = {};
    if (body.orderStatus && allowedStatus.includes(body.orderStatus)) update.orderStatus = body.orderStatus;
    if (body.paymentStatus && allowedPayment.includes(body.paymentStatus)) update.paymentStatus = body.paymentStatus;

    await connectToDatabase();
    const updated = await Order.findByIdAndUpdate(params.id, update, { new: true });
    if (!updated) return Response.json({ message: "Order not found." }, { status: 404 });

    return Response.json({ data: updated });
  } catch {
    return Response.json({ message: "Unable to update order." }, { status: 500 });
  }
}

