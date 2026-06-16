import { EmpresaManagement } from "@/components/empresas/empresa-management";
import type { CampoEmpresaConfig } from "@/services/campos.service";
import type { CategoriaOption, EmpresaRecord } from "@/types/empresa";
import type { PapelUsuario } from "@prisma/client";

type Props = {
  empresas: EmpresaRecord[];
  categorias: CategoriaOption[];
  role: PapelUsuario;
  campos: CampoEmpresaConfig[];
  exportCsvUrl?: string;
  exportXlsxUrl?: string;
  exportPdfUrl?: string;
  temFiltrosAtivos?: boolean;
  segmentoSlug?: string;
};

export function EmpresaTable({ empresas, categorias, role, campos, exportCsvUrl, exportXlsxUrl, exportPdfUrl, temFiltrosAtivos, segmentoSlug }: Props) {
  return (
    <EmpresaManagement
      empresas={empresas}
      categorias={categorias}
      role={role}
      campos={campos}
      exportCsvUrl={exportCsvUrl}
      exportXlsxUrl={exportXlsxUrl}
      exportPdfUrl={exportPdfUrl}
      temFiltrosAtivos={temFiltrosAtivos}
      segmentoSlug={segmentoSlug}
    />
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
