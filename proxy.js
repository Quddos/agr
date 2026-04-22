import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export function proxy(request) {
  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ags_token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
