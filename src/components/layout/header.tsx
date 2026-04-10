import type { PapelUsuario } from "@prisma/client";
import { Shield } from "lucide-react";
import { LogoutButton } from "./logout-button";

// Mapeia roles para textos legíveis
const ROLE_LABELS: Record<PapelUsuario, string> = {
  ADMIN: "Administrador",
  ANALISTA: "Analista",
  VISUALIZADOR: "Visualizador",
};

export function Header({ role }: { role: PapelUsuario }) {
  const roleLabel = ROLE_LABELS[role] || role;

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto w-full max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-[#1b3383]">
              Cadastro de Empresas
            </h1>
            <p className="mt-0.5 text-xs text-slate-600">
              Gestão de empresas - São Cristóvão
            </p>
          </div>

          {/* Badge de Perfil e Logout */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
              <Shield className="h-4 w-4 flex-shrink-0 text-[#1b3383]" />
              <span className="whitespace-nowrap text-xs font-semibold text-[#1b3383]">
                {roleLabel}
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
