import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/apiAuth";
import { Statement } from "@/models/Statement";

export async function GET(request) {
  const { error } = requireAuth(request);
  if (error) return error;

  await connectToDatabase();
  const statements = await Statement.find().sort({ date: -1 }).populate("crop", "name");

  const summary = statements.reduce(
    (acc, item) => {
      if (item.type === "income") acc.income += item.amount;
      if (item.type === "expense") acc.expense += item.amount;
      acc.net = acc.income - acc.expense;
      return acc;
    },
    { income: 0, expense: 0, net: 0 }
  );

  return Response.json({ data: statements, summary });
}

export async function POST(request) {
  const { error, user } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { type, amount, note, date, crop } = body;
    if (!type || amount === undefined) {
      return Response.json({ message: "Missing required fields." }, { status: 400 });
    }

    await connectToDatabase();
    const statement = await Statement.create({
      type,
      amount: Number(amount),
      note,
      date: date ? new Date(date) : new Date(),
      crop: crop || null,
      createdBy: user.id,
    });

    return Response.json({ data: statement }, { status: 201 });
  } catch {
    return Response.json({ message: "Unable to create statement." }, { status: 500 });
  }
}
