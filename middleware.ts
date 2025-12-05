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

    // Admin routes - require specific permissions
    if (path.startsWith("/admin/users")) {
      if (!token.permissions?.includes("users.view")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (path.startsWith("/admin/roles")) {
      if (!token.permissions?.includes("roles.view")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (path.startsWith("/admin/staff")) {
      if (!token.permissions?.includes("staff.view")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
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
    "/monthly-expenses/:path*",
    "/yearly-expenses/:path*",
    "/bookings/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};