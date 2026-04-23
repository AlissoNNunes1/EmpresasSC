export type ResponsavelEmpresa = {
  nome: string;
  tipo: "PROPRIETARIO" | "GERENTE" | "RH";
  cpf: string;
  contato: string;
};

export type EmpresaRecord = {
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
  responsaveis: ResponsavelEmpresa[];
  camposCustom: Array<{ campoId: number; valor: string; campo: { nome: string; label: string } }>;
};

export type CategoriaOption = {
  id: number;
  nome: string;
};

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
