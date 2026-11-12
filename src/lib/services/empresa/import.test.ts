import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";
import {
  detectColumnMappings,
  parseImportFile,
  resolveCategoriaNome,
  resolveDocumentoFiscal,
} from "./import";

function xlsxBuffer(rows: unknown[][]): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Planilha1");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

// Layout "Consulta quentinhas": título acima do cabeçalho, sem coluna de CNPJ,
// linha de total e bloco de observações após os dados.
const QUENTINHAS_ROWS: unknown[][] = [
  ["Consulta sobre interesse de fornecedores - Licitação exemplo", "", "", "", "", "", "", ""],
  ["Nº", "Estabelecimento", "Local/Bairro", "Endereço", "Contato", "Interessado", "Celular", "Capacidade diária"],
  ["1", "Churrascaria Exemplo", "Centro Histórico", "Rua Exemplo, 25", "Mateus", "Sim", "98101 9228", "120"],
  ["2", "Restaurante Exemplo", "Divineia", "Avenida Exemplo, 162-A", "Ana", "Não (4)", "98818 2592", ""],
  ["", "", "", "", "", "", "", "550"],
  ["Observações:", "", "", "", "", "", "", ""],
  ["1", "Não está fornecendo / sem CNPJ", "", "", "", "", "", ""],
];

// Layout "Relação do Núcleo": cabeçalho direto, CNPJ/CPF, "Nome" é o responsável,
// "Empresa / Entidade" é o estabelecimento e a coluna "e-mail" traz endereços.
const MULHERES_ROWS: unknown[][] = [
  ["Nº", "Nome", "CNPJ", "Telefone", "Empresa / Entidade", "e-mail"],
  ["1", "Terezinha Exemplo", "20.380.400/0001-87", "99984 4900", "Farmacia Exemplo", "Rua Exemplo, 284"],
  ["2", "Celma Exemplo", "008.104.135-78", "99684 8249", "Mercearia Exemplo", "Rua do Exemplo, 289 "],
  ["3", "Ana Exemplo", "", "3261-2539", "Moda Exemplo", "maria@exemplo.com"],
];

describe("parseImportFile — layouts de planilhas reais", () => {
  it("importa planilha com título acima do cabeçalho e linha de total", async () => {
    const rows = await parseImportFile(xlsxBuffer(QUENTINHAS_ROWS));

    assert.equal(rows.length, 2);
    assert.equal(rows[0].estabelecimento, "Churrascaria Exemplo");
    assert.equal(rows[0].bairro, "Centro Histórico");
    assert.equal(rows[0].logradouro, "Rua Exemplo, 25");
    assert.equal(rows[0].responsavelNome, "Mateus");
    assert.equal(rows[0].responsavelContato, "98101 9228");
  });

  it("não transforma o título da planilha em categoria ou atividade", async () => {
    const rows = await parseImportFile(xlsxBuffer(QUENTINHAS_ROWS));

    assert.equal(rows[0].atividadePrincipal, undefined);
    assert.equal(rows[0].categoria, undefined);
  });

  it("importa planilha com coluna Nome como responsável e Empresa / Entidade como razão social", async () => {
    const rows = await parseImportFile(xlsxBuffer(MULHERES_ROWS));

    assert.equal(rows.length, 3);
    assert.equal(rows[0].razaoSocial, "Farmacia Exemplo");
    assert.equal(rows[0].responsavelNome, "Terezinha Exemplo");
    assert.equal(rows[0].responsavelContato, "99984 4900");
    assert.equal(rows[0].cnpj, "20.380.400/0001-87");
  });

  it("trata CPF formatado e linha sem documento", async () => {
    const rows = await parseImportFile(xlsxBuffer(MULHERES_ROWS));
    const cpf = resolveDocumentoFiscal(rows[1] as Parameters<typeof resolveDocumentoFiscal>[0]);

    assert.equal(cpf.documento, "00810413578");
    assert.equal(cpf.origem, "CPF");
    assert.equal(resolveDocumentoFiscal(rows[2] as Parameters<typeof resolveDocumentoFiscal>[0]).origem, "SINTETICO");
  });

  it("coluna e-mail com endereço vai para logradouro; e-mail real vai para contato", async () => {
    const rows = await parseImportFile(xlsxBuffer(MULHERES_ROWS));

    assert.equal(rows[0].logradouro, "Rua Exemplo, 284");
    assert.equal(rows[1].logradouro, "Rua do Exemplo, 289");
    assert.equal(rows[2].logradouro, undefined);
    assert.equal(rows[2].responsavelContato, "maria@exemplo.com");
  });
});

describe("correspondência aproximada de cabeçalho (fuse.js)", () => {
  it("cabeçalho com erro de digitação é mapeado como aproximado", async () => {
    const { colunas } = await detectColumnMappings(xlsxBuffer([
      ["Estabelecimento", "CNPJ", "Telefome"],
      ["Loja Exemplo", "18.258.018/0001-53", "99999 9999"],
    ]));
    const telefone = colunas.find((c) => c.source === "telefome");

    assert.equal(telefone?.target, "responsavelContato");
    assert.equal(telefone?.method, "fuzzy");
  });

  it("cabeçalho longo que não corresponde a nada não quebra a busca", async () => {
    const { colunas } = await detectColumnMappings(xlsxBuffer([
      ["Estabelecimento", "CNPJ", "Quantidade de funcionarios registrados na empresa desde a fundação"],
      ["Loja Exemplo", "18.258.018/0001-53", "12"],
    ]));
    const longo = colunas.find((c) => c.source.startsWith("quantidade de funcionarios"));

    assert.equal(longo?.target, null);
  });
});

describe("coluna Nome e categoria padrão", () => {
  it("'Nome' é o responsável quando a planilha também tem coluna de empresa", async () => {
    const rows = await parseImportFile(xlsxBuffer([
      ["Nome", "Empresa / Entidade", "CNPJ"],
      ["Ana Exemplo", "Loja Exemplo", "18.258.018/0001-53"],
    ]));

    assert.equal(rows[0].responsavelNome, "Ana Exemplo");
    assert.equal(rows[0].estabelecimento, "Loja Exemplo");
  });

  it("'Nome' é o estabelecimento quando não há coluna de empresa", async () => {
    const rows = await parseImportFile(xlsxBuffer([["Nome", "CNPJ"], ["Mercado Exemplo", "18.258.018/0001-53"]]));

    assert.equal(rows[0].estabelecimento, "Mercado Exemplo");
    assert.equal(rows[0].responsavelNome, undefined);
  });

  it("categoria sem categoria nem atividade vira 'Não informado'", () => {
    assert.equal(resolveCategoriaNome({ estabelecimento: "Mercado Exemplo" }), "Não informado");
  });
});

describe("detectColumnMappings — layouts de planilhas reais", () => {
  it("reconhece colunas da planilha de quentinhas", async () => {
    const { colunas } = await detectColumnMappings(xlsxBuffer(QUENTINHAS_ROWS));
    const alvo = (source: string) => colunas.find((c) => c.source === source)?.target;

    assert.equal(alvo("estabelecimento"), "estabelecimento");
    assert.equal(alvo("local bairro"), "bairro");
    assert.equal(alvo("endereco"), "logradouro");
    assert.equal(alvo("contato"), "responsavelNome");
    assert.equal(alvo("celular"), "responsavelContato");
  });

  it("reconhece colunas da planilha de mulheres empreendedoras", async () => {
    const { colunas } = await detectColumnMappings(xlsxBuffer(MULHERES_ROWS));
    const alvo = (source: string) => colunas.find((c) => c.source === source)?.target;

    assert.equal(alvo("nome"), "responsavelNome");
    assert.equal(alvo("cnpj"), "cnpj");
    assert.equal(alvo("empresa entidade"), "razaoSocial");
    assert.equal(alvo("e mail"), "logradouro");
  });
});

describe("resolveDocumentoFiscal", () => {
  it("aceita CNPJ formatado e normaliza para apenas dígitos", () => {
    const resultado = resolveDocumentoFiscal({ cnpj: "18.258.018/0001-53" });

    assert.equal(resultado.documento, "18258018000153");
    assert.equal(resultado.origem, "CNPJ");
  });

  it("aceita CPF formatado e normaliza para apenas dígitos", () => {
    const resultado = resolveDocumentoFiscal({ cnpj: "396.645.545-53" });

    assert.equal(resultado.documento, "39664554553");
    assert.equal(resultado.origem, "CPF");
  });

  it("gera documento sintético estável quando o campo vem vazio ou textual", () => {
    const vazio = resolveDocumentoFiscal({
      estabelecimento: "Mercado Exemplo",
      razaoSocial: "",
      nomeFantasia: "Exemplo",
      cnpj: "",
      atividadePrincipal: "Mercearia",
      bairro: "Centro",
      logradouro: "Rua A",
      responsavelNome: "João da Silva",
      responsavelContato: "99999-9999",
      porte: "MICRO",
      situacao: "ATIVA",
    });

    const textual = resolveDocumentoFiscal({
      estabelecimento: "Mercado Exemplo",
      razaoSocial: "",
      nomeFantasia: "Exemplo",
      cnpj: "sem CNPJ",
      atividadePrincipal: "Mercearia",
      bairro: "Centro",
      logradouro: "Rua A",
      responsavelNome: "João da Silva",
      responsavelContato: "99999-9999",
      porte: "MICRO",
      situacao: "ATIVA",
    });

    assert.equal(vazio.documento.length, 14);
    assert.equal(textual.documento.length, 14);
    assert.equal(vazio.origem, "SINTETICO");
    assert.equal(textual.origem, "SINTETICO");
    assert.equal(vazio.documento, textual.documento);
  });

  it("usa atividade principal como categoria quando a categoria estiver vazia", () => {
    const categoria = resolveCategoriaNome({
      categoria: "",
      atividadePrincipal: "Supermercado",
      estabelecimento: "Mercado Exemplo",
    });

    assert.equal(categoria, "Supermercado");
  });

  it("normaliza CNPJ com zero excedente à esquerda", () => {
    const resultado = resolveDocumentoFiscal({ cnpj: "044.559.275/0001-30" });

    assert.equal(resultado.documento, "44559275000130");
    assert.equal(resultado.origem, "CNPJ");
  });

  it("usa fallback sintético quando documento está truncado", () => {
    const resultado = resolveDocumentoFiscal({
      cnpj: "55.325.801/0001",
      estabelecimento: "Mercearia Oliveira Silva",
      atividadePrincipal: "Mercearia",
    });

    assert.equal(resultado.documento.length, 14);
    assert.equal(resultado.origem, "SINTETICO");
  });
});
