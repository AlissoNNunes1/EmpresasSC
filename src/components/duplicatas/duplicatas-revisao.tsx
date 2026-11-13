"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { GrupoDuplicata, MembroDuplicata } from "@/lib/services/duplicatas/revisao";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

const PAGINA = 20;

type Campo = { rotulo: string; valor: (m: MembroDuplicata) => string };

const CAMPOS: Campo[] = [
  { rotulo: "CNPJ / CPF", valor: (m) => formatarDocumento(m.cnpj) },
  { rotulo: "Razão social", valor: (m) => m.razaoSocial },
  { rotulo: "Nome fantasia", valor: (m) => m.nomeFantasia ?? "" },
  { rotulo: "Categoria", valor: (m) => m.categoria },
  { rotulo: "Atividade principal", valor: (m) => m.atividadePrincipal },
  { rotulo: "Porte", valor: (m) => m.porte },
  { rotulo: "Nº empregados", valor: (m) => String(m.numeroEmpregados) },
  { rotulo: "Situação", valor: (m) => m.situacao },
  { rotulo: "CEP", valor: (m) => formatarCep(m.cep) },
  { rotulo: "Logradouro", valor: (m) => m.logradouro },
  { rotulo: "Bairro", valor: (m) => m.bairro },
  { rotulo: "Telefone", valor: (m) => m.telefone },
  { rotulo: "Responsável", valor: (m) => m.responsavel },
];

function formatarDocumento(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 14) return digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  if (digitos.length === 11) return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return valor;
}

function formatarCep(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  return digitos.length === 8 ? digitos.replace(/(\d{5})(\d{3})/, "$1-$2") : valor;
}

/** Quantos campos preenchidos a empresa tem: a mais completa é sugerida para manter. */
function pontuacaoDeCompletude(membro: MembroDuplicata): number {
  return CAMPOS.filter((campo) => campo.valor(membro).trim() !== "" && campo.valor(membro) !== "0").length;
}

function sugerida(grupo: GrupoDuplicata): number {
  return grupo.membros.reduce((melhor, atual) =>
    pontuacaoDeCompletude(atual) > pontuacaoDeCompletude(melhor) ? atual : melhor,
  ).id;
}

function campoDiverge(grupo: GrupoDuplicata, campo: Campo): boolean {
  const valores = new Set(grupo.membros.map((m) => campo.valor(m).trim().toLowerCase()));
  return valores.size > 1;
}

export function DuplicatasRevisao({ grupos: iniciais, podeRemover }: { grupos: GrupoDuplicata[]; podeRemover: boolean }) {
  const [grupos, setGrupos] = useState(iniciais);
  const [selecionadas, setSelecionadas] = useState<Record<string, number>>({});
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [visiveis, setVisiveis] = useState(PAGINA);

  const escolhida = (grupo: GrupoDuplicata) => selecionadas[grupo.chave] ?? sugerida(grupo);

  function removerGrupo(chave: string) {
    setGrupos((atuais) => atuais.filter((g) => g.chave !== chave));
  }

  async function enviar(grupo: GrupoDuplicata, url: string, corpo: unknown): Promise<boolean> {
    setOcupado(grupo.chave);
    setErros((atuais) => ({ ...atuais, [grupo.chave]: "" }));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        setErros((atuais) => ({ ...atuais, [grupo.chave]: payload?.error ?? "Falha ao salvar a revisão." }));
        return false;
      }
      return true;
    } catch {
      setErros((atuais) => ({ ...atuais, [grupo.chave]: "Não foi possível salvar a revisão." }));
      return false;
    } finally {
      setOcupado(null);
    }
  }

  async function marcarNaoDuplicatas(grupo: GrupoDuplicata) {
    const ok = await enviar(grupo, "/api/duplicatas/nao-duplicatas", {
      empresaIds: grupo.membros.map((m) => m.id),
    });
    if (ok) removerGrupo(grupo.chave);
  }

  async function manterEscolhida(grupo: GrupoDuplicata) {
    const manterId = escolhida(grupo);
    const removerIds = grupo.membros.map((m) => m.id).filter((id) => id !== manterId);
    const ok = await enviar(grupo, "/api/duplicatas/manter", { manterId, removerIds });
    if (ok) {
      setConfirmando(null);
      removerGrupo(grupo.chave);
    }
  }

  if (grupos.length === 0) {
    return (
      <Card className="card-elevated">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          <p className="font-semibold text-slate-700">Nenhuma possível duplicata pendente.</p>
          <p className="text-sm text-slate-500">Quando a importação ou o cadastro gerarem novos candidatos, eles aparecem aqui.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {grupos.slice(0, visiveis).map((grupo, indice) => {
        const escolha = escolhida(grupo);
        const erro = erros[grupo.chave];
        const ativo = ocupado === grupo.chave;
        const removerQuantidade = grupo.membros.length - 1;

        return (
          <Card key={grupo.chave} className="card-elevated">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#1b3383]">
                    Grupo {indice + 1} · {grupo.membros.length} empresas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      {Math.round(grupo.scoreMaximo * 100)}% semelhante
                    </span>
                    {grupo.motivos.map((motivo) => (
                      <span key={motivo} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {motivo}
                      </span>
                    ))}
                  </div>
                </div>
              </header>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs text-slate-500">
                      <th className="w-40 px-3 py-2 font-semibold">Campo</th>
                      {grupo.membros.map((membro) => {
                        const marcada = escolha === membro.id;
                        return (
                          <th key={membro.id} className={`px-3 py-2 font-semibold ${marcada ? "bg-blue-50 text-[#1b3383]" : ""}`}>
                            <label className="flex cursor-pointer items-start gap-2">
                              <input
                                type="radio"
                                name={`manter-${grupo.chave}`}
                                checked={marcada}
                                onChange={() => setSelecionadas((atuais) => ({ ...atuais, [grupo.chave]: membro.id }))}
                                className="mt-0.5 accent-[#1b3383]"
                                disabled={ativo}
                              />
                              <span>
                                <span className="block">Manter esta</span>
                                <span className="block font-normal text-slate-400">#{membro.id}</span>
                                {membro.id === sugerida(grupo) && (
                                  <span className="mt-0.5 inline-block rounded bg-emerald-100 px-1.5 text-[10px] font-semibold text-emerald-700">
                                    mais completa
                                  </span>
                                )}
                              </span>
                            </label>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {CAMPOS.map((campo) => {
                      const diverge = campoDiverge(grupo, campo);
                      return (
                        <tr key={campo.rotulo} className={`border-t border-slate-100 ${diverge ? "bg-amber-50" : ""}`}>
                          <td className="px-3 py-2 text-xs font-medium text-slate-500">
                            {campo.rotulo}
                            {diverge && <span className="ml-1 text-amber-600">•</span>}
                          </td>
                          {grupo.membros.map((membro) => (
                            <td
                              key={membro.id}
                              className={`px-3 py-2 align-top text-slate-800 ${escolha === membro.id ? "bg-blue-50/60" : ""}`}
                            >
                              {campo.valor(membro) || <span className="text-slate-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400">• campo diferente entre as empresas do grupo</p>

              {erro && (
                <p className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  <AlertTriangle className="h-4 w-4" /> {erro}
                </p>
              )}

              <footer className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button variant="outline" size="sm" onClick={() => marcarNaoDuplicatas(grupo)} disabled={ativo}>
                  {ativo ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Não são duplicatas
                </Button>

                {podeRemover && confirmando !== grupo.chave && (
                  <Button variant="danger" size="sm" onClick={() => setConfirmando(grupo.chave)} disabled={ativo}>
                    Manter a selecionada e excluir {removerQuantidade} {removerQuantidade === 1 ? "outra" : "outras"}
                  </Button>
                )}

                {podeRemover && confirmando === grupo.chave && (
                  <div className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-3 sm:flex-row sm:items-center">
                    <p className="text-sm text-red-900">
                      Excluir {removerQuantidade} {removerQuantidade === 1 ? "empresa" : "empresas"}? Não dá para desfazer.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="danger" size="sm" onClick={() => manterEscolhida(grupo)} disabled={ativo}>
                        {ativo ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Confirmar exclusão
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmando(null)} disabled={ativo}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </footer>
            </CardContent>
          </Card>
        );
      })}

      {grupos.length > visiveis && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisiveis((v) => v + PAGINA)}>
            Mostrar mais ({grupos.length - visiveis} restantes)
          </Button>
        </div>
      )}
    </div>
  );
}
