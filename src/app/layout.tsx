import type { Metadata } from "next";
import { Merriweather, Source_Sans_3 } from "next/font/google";
import "@/styles/globals.css";

const heading = Merriweather({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sistema Administrativo de Empresas - Sao Cristovao",
  description: "Cadastro e gestao de empresas de Sao Cristovao, do MEI ao grande porte.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${heading.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 font-body text-slate-900">{children}</body>
    </html>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
