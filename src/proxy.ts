import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (process.env.NODE_ENV === "production") {
    const forwardedProto = request.headers.get("x-forwarded-proto");
    if (forwardedProto !== "https") {
      const secureUrl = new URL(request.url);
      secureUrl.protocol = "https:";
      return NextResponse.redirect(secureUrl);
    }
  }

  if (PUBLIC_PATHS.some((value) => path.startsWith(value))) {
    return NextResponse.next();
  }

  let token = null;

  try {
    token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  } catch (error) {
    console.warn("Falha ao ler token JWT no proxy. Cookie pode estar invalido.", error);
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
