import { normalizeUserRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.senha) {
          return null;
        }

        const user = await prisma.usuario.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.ativo) {
          return null;
        }

        const passwordMatches = await compare(credentials.senha, user.senhaHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.nome,
          email: user.email,
          role: user.papel,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = normalizeUserRole(user.role);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = normalizeUserRole(token.role);
      }

      return session;
    },
  },
};

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
