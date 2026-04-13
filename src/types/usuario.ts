export type UsuarioSistema = {
  id: number;
  nome: string;
  email: string;
  role: "ADMIN" | "ANALISTA" | "VISUALIZADOR";
  status: "ATIVO" | "INATIVO";
  ultimoAcesso: string | null;
  criadoEm: string;
};

export type UsuarioFiltros = {
  termo?: string;
  role?: "ADMIN" | "ANALISTA" | "VISUALIZADOR";
  status?: "ATIVO" | "INATIVO";
};

export type UsuarioPayload = {
  nome: string;
  email: string;
  role: "ADMIN" | "ANALISTA" | "VISUALIZADOR";
  status: "ATIVO" | "INATIVO";
  senha?: string;
};

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
