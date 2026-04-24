import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/apiAuth";
import { forbiddenResponse } from "@/lib/auth";
import { Order } from "@/models/Order";

export async function GET(request) {
  const { error, user } = requireAuth(request);
  if (error) return error;
  if (user.role !== "admin" && user.role !== "manager") {
    return forbiddenResponse("Only admin or manager can view sales summary.");
  }

  await connectToDatabase();
  const orders = await Order.find().sort({ createdAt: 1 });

  const totals = orders.reduce(
    (acc, order) => {
      acc.orders += 1;
      acc.revenue += order.total || 0;
      acc.paid += order.paymentStatus === "paid" ? order.total || 0 : 0;
      acc.cod += order.paymentMethod === "cod" ? order.total || 0 : 0;
      return acc;
    },
    { orders: 0, revenue: 0, paid: 0, cod: 0 }
  );

  const byDay = {};
  for (const order of orders) {
    const day = new Date(order.createdAt).toISOString().slice(0, 10);
    byDay[day] = byDay[day] || { day, revenue: 0, orders: 0 };
    byDay[day].revenue += order.total || 0;
    byDay[day].orders += 1;
  }

  return Response.json({
    totals,
    series: Object.values(byDay),
  });
}

