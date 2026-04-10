"use client";

import { Building2, FileBarChart2, LayoutDashboard, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/usuarios", label: "Usuários", icon: Users },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  // Determina se um item está ativo
  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-full rounded-lg bg-white lg:w-56">
      {/* Cabeçalho da Sidebar - simplificado */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-[#1b3383] to-[#2a4ba6] px-3 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-white">
          EmpresasSC
        </p>
      </div>

      {/* Menu de navegação com melhor contraste */}
      <nav
        className="flex flex-col gap-0.5 overflow-x-auto p-2 lg:overflow-x-visible"
        aria-label="Navegação principal"
      >
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium
                transition-all duration-200
                ${
                  active
                    ? "bg-[#1b3383] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                }
              `}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                  active ? "scale-110" : "group-hover:scale-105"
                }`}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {active && (
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-white"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé removido para ganhar espaço */}
    </aside>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
