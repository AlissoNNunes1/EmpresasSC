"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PapelUsuario } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type CategoriaOption = {
  id: number;
  nome: string;
};

type Responsavel = {
  nome: string;
  tipo: "PROPRIETARIO" | "GERENTE" | "RH";
  cpf: string;
  contato: string;
};

type EmpresaRecord = {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  porte: "MEI" | "MICRO" | "PEQUENA" | "MEDIA" | "GRANDE";
  categoriaId: number;
  atividadePrincipal: string;
  numeroEmpregados: number;
  situacao: "ATIVA" | "INATIVA" | "SUSPENSA" | "ENCERRADA";
  categoria: {
    id: number;
    nome: string;
  };
  endereco: {
    cep: string;
    bairro: string;
    logradouro: string;
  } | null;
  responsaveis: Responsavel[];
};

type EmpresaFormState = {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  porte: "MEI" | "MICRO" | "PEQUENA" | "MEDIA" | "GRANDE";
  categoriaId: string;
  atividadePrincipal: string;
  numeroEmpregados: string;
  situacao: "ATIVA" | "INATIVA" | "SUSPENSA" | "ENCERRADA";
  endereco: {
    cep: string;
    bairro: string;
    logradouro: string;
  };
  responsaveis: Responsavel[];
};

type Props = {
  empresas: EmpresaRecord[];
  categorias: CategoriaOption[];
  role: PapelUsuario;
};

function createEmptyForm(): EmpresaFormState {
  return {
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    porte: "MEI",
    categoriaId: "",
    atividadePrincipal: "",
    numeroEmpregados: "0",
    situacao: "ATIVA",
    endereco: {
      cep: "",
      bairro: "",
      logradouro: "",
    },
    responsaveis: [{ nome: "", tipo: "PROPRIETARIO", cpf: "", contato: "" }],
  };
}

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function EmpresaManagement({ empresas, categorias, role }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EmpresaFormState>(createEmptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = role === "ADMIN" || role === "ANALISTA";
  const canEdit = role === "ADMIN" || role === "ANALISTA";
  const canDelete = role === "ADMIN";

  const headerTitle = useMemo(() => {
    if (mode === "create") {
      return "Cadastrar nova empresa";
    }

    if (mode === "edit") {
      return `Editar empresa #${editingId ?? ""}`;
    }

    return "";
  }, [editingId, mode]);

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setError(null);
    setForm(createEmptyForm());
  }

  function openEdit(empresa: EmpresaRecord) {
    setMode("edit");
    setEditingId(empresa.id);
    setError(null);
    setForm({
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia ?? "",
      cnpj: empresa.cnpj,
      porte: empresa.porte,
      categoriaId: String(empresa.categoriaId),
      atividadePrincipal: empresa.atividadePrincipal,
      numeroEmpregados: String(empresa.numeroEmpregados),
      situacao: empresa.situacao,
      endereco: {
        cep: empresa.endereco?.cep ?? "",
        bairro: empresa.endereco?.bairro ?? "",
        logradouro: empresa.endereco?.logradouro ?? "",
      },
      responsaveis:
        empresa.responsaveis.length > 0
          ? empresa.responsaveis.map((item) => ({
              nome: item.nome,
              tipo: item.tipo,
              cpf: item.cpf,
              contato: item.contato,
            }))
          : [{ nome: "", tipo: "PROPRIETARIO", cpf: "", contato: "" }],
    });
  }

  function cancelForm() {
    setMode(null);
    setEditingId(null);
    setError(null);
    setForm(createEmptyForm());
  }

  function setResponsavelField(index: number, key: keyof Responsavel, value: string) {
    setForm((previous) => {
      const responsaveis = [...previous.responsaveis];
      responsaveis[index] = {
        ...responsaveis[index],
        [key]: value,
      };

      return {
        ...previous,
        responsaveis,
      };
    });
  }

  function addResponsavel() {
    setForm((previous) => ({
      ...previous,
      responsaveis: [...previous.responsaveis, { nome: "", tipo: "PROPRIETARIO", cpf: "", contato: "" }],
    }));
  }

  function removeResponsavel(index: number) {
    setForm((previous) => {
      if (previous.responsaveis.length === 1) {
        return previous;
      }

      return {
        ...previous,
        responsaveis: previous.responsaveis.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      razaoSocial: form.razaoSocial,
      nomeFantasia: form.nomeFantasia || undefined,
      cnpj: normalizeDigits(form.cnpj),
      porte: form.porte,
      categoriaId: Number(form.categoriaId),
      atividadePrincipal: form.atividadePrincipal,
      numeroEmpregados: Number(form.numeroEmpregados),
      situacao: form.situacao,
      endereco: {
        cep: normalizeDigits(form.endereco.cep),
        bairro: form.endereco.bairro,
        logradouro: form.endereco.logradouro,
      },
      responsaveis: form.responsaveis.map((item) => ({
        nome: item.nome,
        tipo: item.tipo,
        cpf: normalizeDigits(item.cpf),
        contato: item.contato,
      })),
    };

    const endpoint = mode === "edit" && editingId ? `/api/empresas/${editingId}` : "/api/empresas";
    const method = mode === "edit" ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Nao foi possivel salvar a empresa.");
      return;
    }

    cancelForm();
    router.refresh();
  }

  async function deleteEmpresa(id: number) {
    const ok = window.confirm("Deseja remover esta empresa? Esta acao nao pode ser desfeita.");
    if (!ok) {
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch(`/api/empresas/${id}`, {
      method: "DELETE",
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Nao foi possivel remover a empresa.");
      return;
    }

    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Empresas ({empresas.length})</CardTitle>
          {canCreate ? (
            <Button onClick={openCreate} disabled={loading}>
              Nova empresa
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode ? (
          <form onSubmit={submitForm} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">{headerTitle}</h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input placeholder="Razao social" value={form.razaoSocial} onChange={(event) => setForm((prev) => ({ ...prev, razaoSocial: event.target.value }))} required />
              <Input placeholder="Nome fantasia" value={form.nomeFantasia} onChange={(event) => setForm((prev) => ({ ...prev, nomeFantasia: event.target.value }))} />
              <Input placeholder="CNPJ (somente numeros)" value={form.cnpj} onChange={(event) => setForm((prev) => ({ ...prev, cnpj: event.target.value }))} required />

              <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={form.porte} onChange={(event) => setForm((prev) => ({ ...prev, porte: event.target.value as EmpresaFormState["porte"] }))}>
                <option value="MEI">MEI</option>
                <option value="MICRO">Micro</option>
                <option value="PEQUENA">Pequena</option>
                <option value="MEDIA">Media</option>
                <option value="GRANDE">Grande</option>
              </select>

              <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={form.categoriaId} onChange={(event) => setForm((prev) => ({ ...prev, categoriaId: event.target.value }))} required>
                <option value="">Selecione a categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>

              <Input placeholder="Atividade principal" value={form.atividadePrincipal} onChange={(event) => setForm((prev) => ({ ...prev, atividadePrincipal: event.target.value }))} required />
              <Input type="number" min={0} placeholder="Numero de empregados" value={form.numeroEmpregados} onChange={(event) => setForm((prev) => ({ ...prev, numeroEmpregados: event.target.value }))} required />

              <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={form.situacao} onChange={(event) => setForm((prev) => ({ ...prev, situacao: event.target.value as EmpresaFormState["situacao"] }))}>
                <option value="ATIVA">Ativa</option>
                <option value="INATIVA">Inativa</option>
                <option value="SUSPENSA">Suspensa</option>
                <option value="ENCERRADA">Encerrada</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input placeholder="CEP" value={form.endereco.cep} onChange={(event) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, cep: event.target.value } }))} required />
              <Input placeholder="Bairro" value={form.endereco.bairro} onChange={(event) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, bairro: event.target.value } }))} required />
              <Input placeholder="Logradouro" value={form.endereco.logradouro} onChange={(event) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, logradouro: event.target.value } }))} required />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Responsaveis</h4>
                <Button type="button" variant="outline" size="sm" onClick={addResponsavel}>
                  Adicionar responsavel
                </Button>
              </div>

              {form.responsaveis.map((responsavel, index) => (
                <div key={`${index}-${responsavel.cpf}`} className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Input placeholder="Nome" value={responsavel.nome} onChange={(event) => setResponsavelField(index, "nome", event.target.value)} required />

                  <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={responsavel.tipo} onChange={(event) => setResponsavelField(index, "tipo", event.target.value)}>
                    <option value="PROPRIETARIO">Proprietario</option>
                    <option value="GERENTE">Gerente</option>
                    <option value="RH">RH</option>
                  </select>

                  <Input placeholder="CPF" value={responsavel.cpf} onChange={(event) => setResponsavelField(index, "cpf", event.target.value)} required />
                  <Input placeholder="Contato" value={responsavel.contato} onChange={(event) => setResponsavelField(index, "contato", event.target.value)} required />

                  <Button type="button" variant="danger" size="sm" onClick={() => removeResponsavel(index)} disabled={form.responsaveis.length === 1}>
                    Remover
                  </Button>
                </div>
              ))}
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : mode === "edit" ? "Salvar alteracoes" : "Cadastrar empresa"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelForm}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Razao Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Porte</TableHead>
                <TableHead>Empregados</TableHead>
                <TableHead>Situacao</TableHead>
                {canEdit || canDelete ? <TableHead>Acoes</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit || canDelete ? 9 : 8} className="py-8 text-center text-sm text-slate-600">
                    Nenhuma empresa encontrada para os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                empresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell>{empresa.id}</TableCell>
                    <TableCell>{empresa.razaoSocial}</TableCell>
                    <TableCell>{empresa.cnpj}</TableCell>
                    <TableCell>{empresa.categoria.nome}</TableCell>
                    <TableCell>{empresa.endereco?.bairro ?? "-"}</TableCell>
                    <TableCell>{empresa.porte}</TableCell>
                    <TableCell>{empresa.numeroEmpregados}</TableCell>
                    <TableCell>
                      <Badge>{empresa.situacao}</Badge>
                    </TableCell>
                    {canEdit || canDelete ? (
                      <TableCell>
                        <div className="flex gap-2">
                          {canEdit ? (
                            <Button variant="outline" size="sm" onClick={() => openEdit(empresa)} disabled={loading}>
                              Editar
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button variant="danger" size="sm" onClick={() => deleteEmpresa(empresa.id)} disabled={loading}>
                              Excluir
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/