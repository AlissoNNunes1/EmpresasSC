import { PapelUsuario } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    role: PapelUsuario;
  }

  interface Session {
    user: {
      id: string;
      role: PapelUsuario;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: PapelUsuario;
  }
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
