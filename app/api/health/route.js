export async function GET() {
  return Response.json({
    status: "ok",
    service: "agric-management-system",
    timestamp: new Date().toISOString(),
  });
}
