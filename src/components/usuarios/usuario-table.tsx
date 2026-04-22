"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UsuarioForm } from "@/components/usuarios/usuario-form";
import { UsuarioModal } from "@/components/usuarios/usuario-modal";
import { atualizarStatusUsuario, atualizarUsuario, criarUsuario, listarUsuarios } from "@/services/usuarios.service";
import type { UsuarioFiltros, UsuarioPayload, UsuarioSistema } from "@/types/usuario";
import { useMemo, useState } from "react";

type Props = {
  initialUsuarios: UsuarioSistema[];
  currentUserId: number;
};

function roleLabel(role: UsuarioSistema["role"]) {
  if (role === "ADMIN") return "Admin";
  if (role === "ANALISTA") return "Gestor";
  return "Operador";
}

function roleClass(role: UsuarioSistema["role"]) {
  if (role === "ADMIN") return "bg-red-50 text-red-700";
  if (role === "ANALISTA") return "bg-amber-50 text-amber-700";
  return "bg-blue-50 text-blue-700";
}

function cargoLabel(role: UsuarioSistema["role"]) {
  if (role === "ADMIN") return "Administrador do sistema";
  if (role === "ANALISTA") return "Gestao operacional";
  return "Operacão básica";
}

export function UsuarioTable({ initialUsuarios, currentUserId }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(initialUsuarios);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<UsuarioFiltros>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioSistema | null>(null);

  const tituloModal = editing ? "Editar usuario" : "Criar usuario";

  const usuariosOrdenados = useMemo(() => {
    return [...usuarios].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [usuarios]);

  async function carregarUsuarios(nextFiltros: UsuarioFiltros = filtros) {
    setLoading(true);
    setErro(null);

    try {
      const data = await listarUsuarios(nextFiltros);
      setUsuarios(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao carregar usuarios.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(payload: UsuarioPayload) {
    setLoading(true);
    setErro(null);

    try {
      if (editing) {
        await atualizarUsuario(editing.id, payload);
      } else {
        await criarUsuario(payload);
      }

      setModalOpen(false);
      setEditing(null);
      await carregarUsuarios();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }

  async function toggleStatus(usuario: UsuarioSistema) {
    const nextStatus = usuario.status === "ATIVO" ? "INATIVO" : "ATIVO";
    const confirmar = window.confirm(`Confirma alterar status para ${nextStatus.toLowerCase()}?`);

    if (!confirmar) {
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      await atualizarStatusUsuario(usuario.id, nextStatus);
      await carregarUsuarios();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao atualizar status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            placeholder="Buscar por nome/email"
            value={filtros.termo ?? ""}
            onChange={(event) => setFiltros((prev) => ({ ...prev, termo: event.target.value || undefined }))}
          />

          <select
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={filtros.role ?? ""}
            onChange={(event) => setFiltros((prev) => ({ ...prev, role: (event.target.value || undefined) as UsuarioFiltros["role"] }))}
          >
            <option value="">Todos os perfis</option>
            <option value="ADMIN">Admin</option>
            <option value="ANALISTA">Gestor</option>
            <option value="VISUALIZADOR">Operador</option>
          </select>

          <select
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={filtros.status ?? ""}
            onChange={(event) => setFiltros((prev) => ({ ...prev, status: (event.target.value || undefined) as UsuarioFiltros["status"] }))}
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>

          <div className="flex gap-2">
            <Button type="button" onClick={() => carregarUsuarios()} disabled={loading}>
              Aplicar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const reset = {} as UsuarioFiltros;
                setFiltros(reset);
                carregarUsuarios(reset);
              }}
              disabled={loading}
            >
              Limpar
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-[#1b3383]">Usuarios ({usuarios.length})</h3>
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            disabled={loading}
          >
            Novo usuario
          </Button>
        </div>

        {erro ? <p className="mb-3 text-sm font-medium text-red-700">{erro}</p> : null}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo/Funcao</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ultimo acesso</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosOrdenados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-600">
                    Nenhum usuario encontrado para os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                usuariosOrdenados.map((usuario) => {
                  const isCurrentUser = usuario.id === currentUserId;
                  return (
                    <TableRow key={usuario.id}>
                      <TableCell>{usuario.nome}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{cargoLabel(usuario.role)}</TableCell>
                      <TableCell>
                        <Badge className={roleClass(usuario.role)}>{roleLabel(usuario.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={usuario.status === "ATIVO"}
                            onChange={() => toggleStatus(usuario)}
                            disabled={loading || isCurrentUser}
                          />
                          <span className={usuario.status === "ATIVO" ? "text-emerald-700" : "text-slate-600"}>
                            {usuario.status === "ATIVO" ? "Ativo" : "Inativo"}
                          </span>
                        </label>
                      </TableCell>
                      <TableCell>
                        {usuario.ultimoAcesso
                          ? new Date(usuario.ultimoAcesso).toLocaleString("pt-BR")
                          : "Sem acesso"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditing(usuario);
                              setModalOpen(true);
                            }}
                            disabled={loading}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(usuario)}
                            disabled={loading || isCurrentUser}
                          >
                            {usuario.status === "ATIVO" ? "Desativar" : "Ativar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <UsuarioModal
        title={tituloModal}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      >
        <UsuarioForm
          mode={editing ? "edit" : "create"}
          initial={editing ?? undefined}
          submitting={loading}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      </UsuarioModal>
    </div>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
