"use client";

import { ConfigCategoriasSegmento } from "@/components/configuracoes/config-categorias-segmento";
import { apiRequest } from "@/services/api";
import type { CategoriaConfig } from "@/services/configuracoes.service";
import { useCallback, useState } from "react";

type Props = {
  segmentoSlug: string;
  initialCategorias: CategoriaConfig[];
};

export function ConfigCategoriasSegmentoWrapper({ segmentoSlug, initialCategorias }: Props) {
  const [categorias, setCategorias] = useState<CategoriaConfig[]>(initialCategorias);

  const reload = useCallback(async () => {
    try {
      const res = await apiRequest<{ data: CategoriaConfig[] }>(
        `/api/segmentos/${segmentoSlug}/categorias`
      );
      setCategorias(res.data);
    } catch {
      // mantém estado atual
    }
  }, [segmentoSlug]);

  return (
    <ConfigCategoriasSegmento
      segmentoSlug={segmentoSlug}
      categorias={categorias}
      onReload={reload}
    />
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
