import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables.");
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getBearerToken(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.replace("Bearer ", "").trim();
}

export function getCookieValue(request, key) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const match = cookies.find((entry) => entry.startsWith(`${key}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

export function makeAuthCookie(token) {
  const isProd = process.env.NODE_ENV === "production";
  const secure = isProd ? "; Secure" : "";
  return `ags_token=${encodeURIComponent(
    token
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`;
}

export function clearAuthCookie() {
  return "ags_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

export function unauthorizedResponse(message = "Unauthorized") {
  return Response.json({ message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return Response.json({ message }, { status: 403 });
}
