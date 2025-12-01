import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect to login if no token
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Admin-only routes
    if (path.startsWith("/admin") && token.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/expenses/:path*",
    "/staff/:path*",
    "/sales/:path*",
    "/admin/:path*",
  ],
};