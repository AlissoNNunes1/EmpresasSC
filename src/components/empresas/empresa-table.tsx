import { EmpresaManagement } from "@/components/empresas/empresa-management";
import type { CategoriaOption, EmpresaRecord } from "@/types/empresa";
import type { PapelUsuario } from "@prisma/client";

type Props = {
  empresas: EmpresaRecord[];
  categorias: CategoriaOption[];
  role: PapelUsuario;
  exportCsvUrl?: string;
  exportXlsxUrl?: string;
  exportPdfUrl?: string;
  temFiltrosAtivos?: boolean;
};

export function EmpresaTable({ empresas, categorias, role, exportCsvUrl, exportXlsxUrl, exportPdfUrl, temFiltrosAtivos }: Props) {
  return (
    <EmpresaManagement
      empresas={empresas}
      categorias={categorias}
      role={role}
      exportCsvUrl={exportCsvUrl}
      exportXlsxUrl={exportXlsxUrl}
      exportPdfUrl={exportPdfUrl}
      temFiltrosAtivos={temFiltrosAtivos}
    />
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
