import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/sign-in") ||
      req.nextUrl.pathname.startsWith("/sign-up");

    // Redirect authenticated users away from auth pages
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    // Protect dashboard and module routes
    const protectedRoutes = [
      "/",
      "/leads",
      "/companies",
      "/pipeline",
      "/outreach",
      "/approvals",
      "/meetings",
      "/proposals",
      "/workflows",
      "/reports",
    ];

    const isProtectedRoute = protectedRoutes.some((route) =>
      req.nextUrl.pathname === route ||
      req.nextUrl.pathname.startsWith(`${route}/`),
    );

    if (!isAuth && isProtectedRoute) {
      return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/",
    "/leads/:path*",
    "/companies/:path*",
    "/pipeline/:path*",
    "/outreach/:path*",
    "/approvals/:path*",
    "/meetings/:path*",
    "/proposals/:path*",
    "/workflows/:path*",
    "/reports/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
