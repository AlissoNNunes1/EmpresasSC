import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

async function handler(req: Request) {
  return NextAuth(authOptions)(req as any);
}

export { handler as GET, handler as POST };

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
