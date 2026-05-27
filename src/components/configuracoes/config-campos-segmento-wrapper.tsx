"use client";

import { ConfigCamposSegmento } from "@/components/configuracoes/config-campos-segmento";
import type { CampoEmpresaConfig } from "@/services/campos.service";
import { apiRequest } from "@/services/api";
import { useState, useCallback } from "react";

type Props = {
  segmentoSlug: string;
  initialCampos: CampoEmpresaConfig[];
};

export function ConfigCamposSegmentoWrapper({ segmentoSlug, initialCampos }: Props) {
  const [campos, setCampos] = useState<CampoEmpresaConfig[]>(initialCampos);

  const reload = useCallback(async () => {
    try {
      const res = await apiRequest<{ data: CampoEmpresaConfig[] }>(
        `/api/segmentos/${segmentoSlug}/campos`
      );
      setCampos(res.data);
    } catch {
      // mantém estado atual em caso de falha
    }
  }, [segmentoSlug]);

  return (
    <ConfigCamposSegmento
      segmentoSlug={segmentoSlug}
      campos={campos}
      onReload={reload}
    />
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
