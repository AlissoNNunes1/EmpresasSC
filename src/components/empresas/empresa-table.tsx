import { EmpresaManagement } from "@/components/empresas/empresa-management";
import type { CategoriaOption, EmpresaRecord } from "@/types/empresa";
import type { PapelUsuario } from "@prisma/client";

type Props = {
  empresas: EmpresaRecord[];
  categorias: CategoriaOption[];
  role: PapelUsuario;
};

export function EmpresaTable({ empresas, categorias, role }: Props) {
  return <EmpresaManagement empresas={empresas} categorias={categorias} role={role} />;
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
