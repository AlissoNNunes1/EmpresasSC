"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
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

type EmpresaDetalheData = {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  porte: "MEI" | "MICRO" | "PEQUENA" | "MEDIA" | "GRANDE";
  categoriaId: number;
  atividadePrincipal: string;
  numeroEmpregados: number;
  situacao: "ATIVA" | "INATIVA" | "SUSPENSA" | "ENCERRADA";
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

type EmpresaDetalheAcoesProps = {
  canEdit: boolean;
  canDelete: boolean;
  categorias: CategoriaOption[];
  empresa: EmpresaDetalheData;
};

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function createFormFromEmpresa(empresa: EmpresaDetalheData): EmpresaFormState {
  return {
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
  };
}

export function EmpresaDetalheAcoes({ canEdit, canDelete, categorias, empresa }: EmpresaDetalheAcoesProps) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EmpresaFormState>(() => createFormFromEmpresa(empresa));

  const headerTitulo = useMemo(() => `Editar empresa #${empresa.id}`, [empresa.id]);

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

  function cancelForm() {
    setEditando(false);
    setError(null);
    setForm(createFormFromEmpresa(empresa));
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

    const response = await fetch(`/api/empresas/${empresa.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Não foi possível salvar a empresa.");
      return;
    }

    setEditando(false);
    router.refresh();
  }

  async function deleteEmpresa() {
    const ok = window.confirm("Deseja remover esta empresa? Esta ação não pode ser desfeita.");
    if (!ok) {
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch(`/api/empresas/${empresa.id}`, {
      method: "DELETE",
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Não foi possível remover a empresa.");
      return;
    }

    router.push("/empresas");
    router.refresh();
  }

  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {canEdit ? (
          <Button type="button" onClick={() => setEditando((valorAtual) => !valorAtual)} disabled={loading} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            {editando ? "Fechar edição" : "Editar"}
          </Button>
        ) : null}
        {canDelete ? (
          <Button type="button" variant="danger" onClick={deleteEmpresa} disabled={loading} className="gap-1.5">
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        ) : null}
      </div>

      {editando ? (
        <form onSubmit={submitForm} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{headerTitulo}</h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input placeholder="Razão social" value={form.razaoSocial} onChange={(event) => setForm((prev) => ({ ...prev, razaoSocial: event.target.value }))} required />
            <Input placeholder="Nome fantasia" value={form.nomeFantasia} onChange={(event) => setForm((prev) => ({ ...prev, nomeFantasia: event.target.value }))} />
            <Input placeholder="CNPJ (somente números)" value={form.cnpj} onChange={(event) => setForm((prev) => ({ ...prev, cnpj: event.target.value }))} required />

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
            <Input type="number" min={0} placeholder="Número de empregados" value={form.numeroEmpregados} onChange={(event) => setForm((prev) => ({ ...prev, numeroEmpregados: event.target.value }))} required />

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
              <h4 className="text-sm font-semibold text-slate-900">Responsáveis</h4>
              <Button type="button" variant="outline" size="sm" onClick={addResponsavel}>
                Adicionar responsável
              </Button>
            </div>

            {form.responsaveis.map((responsavel, index) => (
              <div key={`${index}-${responsavel.cpf}`} className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-5">
                <Input placeholder="Nome" value={responsavel.nome} onChange={(event) => setResponsavelField(index, "nome", event.target.value)} required />

                <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={responsavel.tipo} onChange={(event) => setResponsavelField(index, "tipo", event.target.value)}>
                  <option value="PROPRIETARIO">Proprietário</option>
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
              {loading ? "Salvando..." : "Salvar alterações"}
            </Button>
            <Button type="button" variant="outline" onClick={cancelForm}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export function EmpresaForm() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">Cadastro de Empresa</h2>
      <p className="mt-1 text-sm text-slate-600">Use o formulário completo na tela principal de empresas.</p>
      <div className="mt-3">
        <Link href="/empresas" className="inline-flex h-10 items-center rounded-md bg-sky-700 px-4 text-sm font-medium text-white hover:bg-sky-800">
          Ir para empresas
        </Link>
      </div>
    </div>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
