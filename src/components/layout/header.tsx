import type { PapelUsuario } from "@prisma/client";
import { Shield } from "lucide-react";
import { LogoutButton } from "./logout-button";

const ROLE_LABELS: Record<PapelUsuario, string> = {
  ADMIN: "Administrador",
  ANALISTA: "Analista",
  VISUALIZADOR: "Visualizador",
};

export function Header({ role }: { role: PapelUsuario }) {
  const roleLabel = ROLE_LABELS[role] || role;

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto w-full max-w-7xl px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Timbre institucional */}
          <img
            src="/timbre.png"
            alt="Secretaria Municipal de Desenvolvimento Econômico e do Trabalho — Prefeitura de São Cristóvão"
            className="h-10 w-auto object-contain"
          />

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
