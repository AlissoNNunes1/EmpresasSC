"use client";

import { listarEmpresas } from "@/services/empresas.service";
import type { EmpresaRecord } from "@/types/empresa";
import { useCallback, useEffect, useState } from "react";

export function useEmpresas(query = "") {
  const [empresas, setEmpresas] = useState<EmpresaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listarEmpresas(query);
      setEmpresas(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar empresas.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  return { empresas, loading, error, reload: load };
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
