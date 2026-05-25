"use client";

import { hasRequiredRole, normalizeUserRole } from "@/lib/permissions";
import type { PapelUsuario } from "@prisma/client";
import {
  Briefcase,
  Building2,
  ChevronDown,
  FileBarChart2,
  LayoutDashboard,
  Map,
  MapPin,
  Settings,
  Users,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import * as LucideIcons from "lucide-react";

type SegmentoNav = {
  id: number;
  nome: string;
  slug: string;
  cor: string | null;
  icone: string | null;
};

type SidebarProps = {
  role: PapelUsuario;
  segmentos: SegmentoNav[];
};

// Resolve ícone Lucide pelo nome string
function SegmentoIcon({ nome, className }: { nome: string | null; className?: string }) {
  const Icon = nome ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[nome] : null;
  if (Icon) return <Icon className={className} />;
  return <Building2 className={className} />;
}

export function Sidebar({ role, segmentos }: SidebarProps) {
  const pathname = usePathname();
  const roleNormalizado = normalizeUserRole(role);
  const [segmentosAberto, setSegmentosAberto] = useState(true);

  const canAdmin = hasRequiredRole(roleNormalizado, "ADMIN" as PapelUsuario);

  const isActive = (href: string, exact = false): boolean => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const linkClass = (active: boolean) =>
    `group inline-flex min-w-max items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
      active
        ? "bg-[#1b3383] text-white shadow-sm"
        : "text-slate-600 hover:bg-[#f0f3fa] hover:text-[#1b3383]"
    }`;

  return (
    <aside className="w-full rounded-xl border border-slate-200 bg-white shadow-sm lg:w-56 lg:self-start">
      <div className="border-b border-slate-200 bg-gradient-to-r from-[#1b3383] to-[#2a4ba6] px-3 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white">
          Plataforma Econômica
        </p>
      </div>

      <nav className="flex gap-0.5 overflow-x-auto p-2 lg:flex-col lg:overflow-x-visible" aria-label="Navegação principal">

        {/* Dashboard geral */}
        <Link href="/" className={linkClass(isActive("/", true))}>
          <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 whitespace-nowrap">Dashboard</span>
          {isActive("/", true) && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-white" />}
        </Link>

        {/* Grupo: Segmentos */}
        <div className="lg:block">
          <button
            type="button"
            onClick={() => setSegmentosAberto((v) => !v)}
            className="inline-flex w-full min-w-max items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-[#1b3383] lg:w-full"
          >
            <span className="flex-1 text-left whitespace-nowrap">Segmentos</span>
            <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${segmentosAberto ? "" : "-rotate-90"}`} />
          </button>

          {segmentosAberto && (
            <div className="flex gap-0.5 lg:flex-col lg:pl-1">
              {segmentos.map((seg) => {
                const active = isActive(`/segmentos/${seg.slug}`);
                return (
                  <Link
                    key={seg.id}
                    href={`/segmentos/${seg.slug}`}
                    className={`group inline-flex min-w-max items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      active ? "text-white shadow-sm" : "text-slate-600 hover:bg-[#f0f3fa]"
                    }`}
                    style={active ? { backgroundColor: seg.cor ?? "#1b3383" } : undefined}
                  >
                    <SegmentoIcon nome={seg.icone} className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 whitespace-nowrap">{seg.nome}</span>
                    {active && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-white/70" />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="hidden h-px bg-slate-100 lg:block lg:my-1" />

        {/* Mapa */}
        <Link href="/mapa" className={linkClass(isActive("/mapa"))}>
          <Map className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 whitespace-nowrap">Mapa</span>
          {isActive("/mapa") && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-white" />}
        </Link>

        {/* Áreas */}
        <Link href="/areas" className={linkClass(isActive("/areas"))}>
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 whitespace-nowrap">Áreas</span>
          {isActive("/areas") && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-white" />}
        </Link>

        {/* Relatórios */}
        <Link href="/relatorios" className={linkClass(isActive("/relatorios"))}>
          <FileBarChart2 className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 whitespace-nowrap">Relatórios</span>
          {isActive("/relatorios") && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-white" />}
        </Link>

        {/* Admin */}
        {canAdmin && (
          <>
            <div className="hidden h-px bg-slate-100 lg:block lg:my-1" />
            <Link href="/usuarios" className={linkClass(isActive("/usuarios"))}>
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 whitespace-nowrap">Usuários</span>
              {isActive("/usuarios") && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-white" />}
            </Link>
            <Link href="/configuracoes" className={linkClass(isActive("/configuracoes"))}>
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 whitespace-nowrap">Configurações</span>
              {isActive("/configuracoes") && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-white" />}
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
