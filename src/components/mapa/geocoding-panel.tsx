"use client";

import { Button } from "@/components/ui/button";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { useState } from "react";

type Status = {
  total: number;
  geocodificadas: number;
  pendentes: number;
  semEndereco: number;
  percentual: number;
};

type Props = {
  status: Status;
  isAdmin: boolean;
};

export function GeocodingPanel({ status: initialStatus, isAdmin }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [rodando, setRodando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function recarregarStatus() {
    const res = await fetch("/api/admin/geocoding");
    if (res.ok) setStatus(await res.json());
  }

  async function iniciarLote() {
    setRodando(true);
    setMensagem(null);
    try {
      const res = await fetch("/api/admin/geocoding", { method: "POST" });
      const data = await res.json() as { message: string; total: number };
      setMensagem(data.message);
    } catch {
      setMensagem("Erro ao iniciar geocodificação.");
    } finally {
      setRodando(false);
      // Aguarda um pouco e recarrega o status
      setTimeout(recarregarStatus, 3000);
    }
  }

  const pendentes = status.pendentes;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Geocodificação automática</p>
          <p className="text-xs text-slate-500">
            {status.geocodificadas} de {status.total} empresas posicionadas no mapa ({status.percentual}%)
            {pendentes > 0 && (
              <span className="ml-1 font-medium text-amber-700">· {pendentes} pendentes</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={recarregarStatus}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
            title="Atualizar status"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {isAdmin && pendentes > 0 && (
            <Button size="sm" onClick={iniciarLote} disabled={rodando} className="gap-1.5">
              {rodando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
              {rodando ? "Geocodificando…" : `Geocodificar ${pendentes} empresa${pendentes !== 1 ? "s" : ""}`}
            </Button>
          )}

          {pendentes === 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              ✓ Todas geocodificadas
            </span>
          )}
        </div>
      </div>

      {mensagem && (
        <p className="mt-2 text-xs text-slate-600 bg-blue-50 rounded px-3 py-2">{mensagem}</p>
      )}

      {/* Barra de progresso */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#1b3383] transition-all duration-500"
          style={{ width: `${status.percentual}%` }}
        />
      </div>
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
