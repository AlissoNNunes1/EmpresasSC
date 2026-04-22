"use client";

import { hasRequiredRole, normalizeUserRole } from "@/lib/permissions";
import type { PapelUsuario } from "@prisma/client";
import { Building2, FileBarChart2, LayoutDashboard, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roleMinima: "VISUALIZADOR" as PapelUsuario },
  { href: "/empresas", label: "Empresas", icon: Building2, roleMinima: "VISUALIZADOR" as PapelUsuario },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart2, roleMinima: "VISUALIZADOR" as PapelUsuario },
  { href: "/usuarios", label: "Usuários", icon: Users, roleMinima: "ADMIN" as PapelUsuario },
  { href: "/configuracoes", label: "Configurações", icon: Settings, roleMinima: "ADMIN" as PapelUsuario },
];

type SidebarProps = {
  role: PapelUsuario;
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const roleNormalizado = normalizeUserRole(role);
  const itensPermitidos = ITEMS.filter((item) => hasRequiredRole(roleNormalizado, item.roleMinima));

  // Determina se um item está ativo
  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-full rounded-xl border border-slate-200 bg-white shadow-sm lg:w-56 lg:self-start">
      {/* Cabeçalho da Sidebar - simplificado */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-[#1b3383] to-[#2a4ba6] px-3 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white">
          EmpresasSC
        </p>
      </div>

      {/* Menu de navegacao com melhor contraste */}
      <nav
        className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-x-visible"
        aria-label="Navegacao principal"
      >
        {itensPermitidos.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group inline-flex min-w-max items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium
                transition-all duration-200
                ${
                  active
                    ? "bg-[#1b3383] text-white shadow-sm"
                    : "text-slate-600 hover:bg-[#f0f3fa] hover:text-[#1b3383]"
                }
              `}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                  active ? "scale-110" : "group-hover:scale-105"
                }`}
              />
              <span className="flex-1 whitespace-nowrap">{item.label}</span>
              {active && (
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-white"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Rodape removido para ganhar espaco */}
    </aside>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
