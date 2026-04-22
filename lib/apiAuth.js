import { getBearerToken, getCookieValue, unauthorizedResponse, verifyToken } from "./auth";

export function requireAuth(request) {
  const token = getBearerToken(request) || getCookieValue(request, "ags_token");
  if (!token) return { error: unauthorizedResponse("Missing token"), user: null };

  const user = verifyToken(token);
  if (!user) return { error: unauthorizedResponse("Invalid token"), user: null };

  return { error: null, user };
}
