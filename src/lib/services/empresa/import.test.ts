import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveCategoriaNome, resolveDocumentoFiscal } from "./import";

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
