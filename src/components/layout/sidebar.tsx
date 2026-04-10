"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileBarChart2, LayoutDashboard, Settings, Users } from "lucide-react";

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
    <aside className="w-full rounded-lg bg-white lg:w-64">
      {/* Cabeçalho da Sidebar com branding */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-[#1b3383] to-[#2a4ba6] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
          Gestão de Empresas
        </p>
        <h2 className="mt-1 text-lg font-bold text-white">São Cristóvão</h2>
      </div>

      {/* Menu de navegação */}
      <nav
        className="flex flex-col gap-1 overflow-x-auto p-3 lg:overflow-x-visible"
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
                group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                transition-all duration-200
                ${
                  active
                    ? "bg-[#1b3383] text-white shadow-md"
                    : "text-slate-700 hover:bg-blue-50"
                }
              `}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={`h-5 w-5 transition-transform duration-200 ${
                  active ? "scale-110" : "group-hover:scale-105"
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {active && (
                <div className="h-2 w-2 rounded-full bg-white"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé informativo */}
      <div className="border-t border-slate-200 px-3 py-3">
        <p className="text-xs text-slate-500">
          Sistema de Gestão <br />
          <span className="font-semibold text-slate-700">EmpresasSC v1.0</span>
        </p>
      </div>
    </aside>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
