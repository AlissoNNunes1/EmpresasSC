import { LogoutButton } from "./logout-button";
import type { PapelUsuario } from "@prisma/client";
import { Shield } from "lucide-react";

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
      <div className="mx-auto w-full max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#1b3383]">
              Cadastro de Empresas
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Sistema de Gestão - São Cristóvão
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Badge de Perfil */}
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
              <Shield className="h-4 w-4 text-[#1b3383]" />
              <span className="text-sm font-medium text-[#1b3383]">
                {roleLabel}
              </span>
            </div>

            {/* Botão de Logout */}
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
