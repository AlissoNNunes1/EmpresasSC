"use client";

import { Button } from "@/components/ui/button";
import type { SegmentoBasico, UsuarioPayload, UsuarioSistema } from "@/types/usuario";
import { useMemo, useState } from "react";

type Props = {
  mode: "create" | "edit";
  initial?: UsuarioSistema;
  segmentos: SegmentoBasico[];   // lista dinâmica de segmentos ativos
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: UsuarioPayload) => Promise<void>;
};

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "ANALISTA", label: "Gestor" },
  { value: "VISUALIZADOR", label: "Operador" },
] as const;

export function UsuarioForm({ mode, initial, segmentos, submitting, onCancel, onSubmit }: Props) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<UsuarioPayload["role"]>(initial?.role ?? "VISUALIZADOR");
  const [status, setStatus] = useState<UsuarioPayload["status"]>(initial?.status ?? "ATIVO");
  const [senha, setSenha] = useState("");
  const [resetarSenha, setResetarSenha] = useState(mode === "create");
  const [segmentoIds, setSegmentoIds] = useState<number[]>(
    initial?.segmentos.map((s) => s.id) ?? []
  );
  const [erro, setErro] = useState<string | null>(null);

  function toggleSegmento(id: number) {
    setSegmentoIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  const submitLabel = useMemo(() => {
    if (submitting) {
      return "Salvando...";
    }
    return mode === "create" ? "Criar usuario" : "Salvar alteracoes";
  }, [mode, submitting]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    if (mode === "create" && senha.length < 8) {
      setErro("Senha deve ter ao menos 8 caracteres.");
      return;
    }

    if (mode === "edit" && resetarSenha && senha.length < 8) {
      setErro("Nova senha deve ter ao menos 8 caracteres.");
      return;
    }

    try {
      await onSubmit({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        role,
        status,
        senha: resetarSenha ? senha : undefined,
        segmentoIds,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar usuario.";
      setErro(message);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="usuario-nome">Nome</label>
          <input
            id="usuario-nome"
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="usuario-email">Email</label>
          <input
            id="usuario-email"
            type="email"
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="usuario-role">Perfil</label>
          <select
            id="usuario-role"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={role}
            onChange={(event) => setRole(event.target.value as UsuarioPayload["role"])}
          >
            {ROLE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="usuario-status">Status</label>
          <select
            id="usuario-status"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as UsuarioPayload["status"])}
          >
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={resetarSenha}
            onChange={(event) => setResetarSenha(event.target.checked)}
          />
          {mode === "create" ? "Definir senha inicial" : "Resetar senha"}
        </label>

        {resetarSenha ? (
          <div className="mt-3 space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="usuario-senha">
              {mode === "create" ? "Senha" : "Nova senha"}
            </label>
            <input
              id="usuario-senha"
              type="password"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Minimo de 8 caracteres"
              required
            />
          </div>
        ) : null}
      </div>

      {/* Segmentos — dinâmico, zero hardcode */}
      {segmentos.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-medium text-slate-700">
            Acesso a segmentos
            <span className="ml-1 text-xs font-normal text-slate-400">(vazio = acesso global)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {segmentos.map((seg) => {
              const ativo = segmentoIds.includes(seg.id);
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => toggleSegmento(seg.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    ativo ? "text-white" : "border border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                  style={ativo ? { backgroundColor: seg.cor ?? "#1b3383" } : undefined}
                >
                  {seg.nome}
                </button>
              );
            })}
          </div>
          {segmentoIds.length === 0 && (
            <p className="mt-1.5 text-xs text-slate-400">Todos os segmentos visíveis.</p>
          )}
        </div>
      )}

      {erro ? <p className="text-sm font-medium text-red-700">{erro}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
