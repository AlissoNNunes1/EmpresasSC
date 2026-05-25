"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, MapPin, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type Status = {
  total: number;
  geocodificadas: number;
  pendentes: number;
  semEndereco: number;
  naoEncontradas?: number;
  percentual: number;
};

type Props = {
  status: Status;
  isAdmin: boolean;
};

const DELAY_MS = 1200; // Nominatim: max 1 req/s

export function GeocodingPanel({ status: initialStatus, isAdmin }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [rodando, setRodando] = useState(false);
  const [ultimaEmpresa, setUltimaEmpresa] = useState<string | null>(null);
  const [ultimaEncontrou, setUltimaEncontrou] = useState<boolean | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const abortRef = useRef(false);

  const recarregarStatus = useCallback(async () => {
    const res = await fetch("/api/admin/geocoding");
    if (res.ok) setStatus(await res.json());
  }, []);

  async function iniciarLote() {
    abortRef.current = false;
    setRodando(true);
    setErro(null);
    setUltimaEmpresa(null);

    try {
      while (!abortRef.current) {
        const res = await fetch("/api/admin/geocoding", { method: "POST" });

        if (!res.ok) {
          setErro(`Erro ${res.status} ao geocodificar. Tente novamente.`);
          break;
        }

        const data = await res.json() as {
          done: boolean;
          empresa?: string;
          encontrou?: boolean;
          geocodificadas: number;
          pendentes: number;
          total: number;
        };

        setStatus((prev) => ({
          ...prev,
          geocodificadas: data.geocodificadas,
          pendentes: data.pendentes,
          total: data.total,
          percentual: data.total > 0 ? Math.round((data.geocodificadas / data.total) * 100) : 0,
        }));

        if (data.empresa) {
          setUltimaEmpresa(data.empresa);
          setUltimaEncontrou(data.encontrou ?? null);
        }

        if (data.done) break;

        // Aguarda antes da próxima (respeita rate limit do Nominatim)
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    } catch (e) {
      setErro("Erro de conexão. Verifique a rede e tente novamente.");
    } finally {
      setRodando(false);
    }
  }

  function pararLote() {
    abortRef.current = true;
  }

  const pendentes = status.pendentes;
  const pct = status.percentual;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Geocodificação automática</p>
          <p className="text-xs text-slate-500">
            {status.geocodificadas} de {status.total} empresas posicionadas ({pct}%)
            {pendentes > 0 && (
              <span className="ml-1 font-medium text-amber-700">· {pendentes} pendentes</span>
            )}
            {(status.naoEncontradas ?? 0) > 0 && (
              <span className="ml-1 text-slate-400">· {status.naoEncontradas} não encontradas</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!rodando && (
            <button
              type="button"
              onClick={recarregarStatus}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
              title="Atualizar status"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}

          {isAdmin && pendentes > 0 && !rodando && (
            <Button size="sm" onClick={iniciarLote} className="gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Geocodificar {pendentes} empresa{pendentes !== 1 ? "s" : ""}
            </Button>
          )}

          {rodando && (
            <Button size="sm" variant="outline" onClick={pararLote} className="gap-1.5 text-red-600 hover:border-red-300 hover:bg-red-50">
              Parar
            </Button>
          )}

          {pendentes === 0 && !rodando && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              ✓ Todas geocodificadas
            </span>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#1b3383] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Empresa atual sendo processada */}
      {rodando && ultimaEmpresa && (
        <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
          <span className="truncate">
            {ultimaEncontrou === false ? "Não encontrada: " : ""}
            {ultimaEmpresa}
          </span>
        </div>
      )}

      {/* Última empresa processada (parado) */}
      {!rodando && ultimaEmpresa && (
        <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs ${ultimaEncontrou ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          {ultimaEncontrou
            ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            : <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
          }
          <span className="truncate">
            Última processada: {ultimaEmpresa}
            {ultimaEncontrou === false && " (endereço não encontrado)"}
          </span>
        </div>
      )}

      {erro && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{erro}</p>
      )}
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
