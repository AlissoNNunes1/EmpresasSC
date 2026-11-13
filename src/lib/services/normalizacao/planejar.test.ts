import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EnderecoCompletado } from "../endereco/regras";
import { espacosNormalizados, planejarNormalizacao, type EmpresaParaNormalizar } from "./planejar";

const empresa = (overrides: Partial<EmpresaParaNormalizar> = {}): EmpresaParaNormalizar => ({
  id: 1,
  razaoSocial: "Mercado Exemplo",
  nomeFantasia: "Exemplo",
  atividadePrincipal: "Mercearia",
  endereco: { cep: "49100000", logradouro: "Rua A, 10", bairro: "Centro" },
  ...overrides,
});

const semMudancaDeEndereco = (cep: string, logradouro: string, bairro: string): EnderecoCompletado => ({
  cep,
  logradouro,
  bairro,
  origem: null,
});

describe("espacosNormalizados", () => {
  it("remove espaços repetidos e das bordas, sem mudar maiúsculas", () => {
    assert.equal(espacosNormalizados("  Mercado   do  João "), "Mercado do João");
  });
});

describe("planejarNormalizacao", () => {
  it("retorna null quando a empresa já está normalizada", () => {
    assert.equal(planejarNormalizacao(empresa(), semMudancaDeEndereco("49100000", "Rua A, 10", "Centro")), null);
  });

  it("corrige espaços e CEP sem zeros à esquerda", () => {
    const mudancas = planejarNormalizacao(
      empresa({ razaoSocial: " Mercado  Exemplo ", endereco: { cep: "4910000", logradouro: "Rua A, 10", bairro: "Centro" } }),
      semMudancaDeEndereco("4910000", "Rua A, 10", "Centro"),
    );

    assert.equal(mudancas?.razaoSocial, "Mercado Exemplo");
    assert.equal(mudancas?.endereco?.cep, "04910000");
  });

  it("aplica o endereço completado pela consulta", () => {
    const mudancas = planejarNormalizacao(
      empresa({ endereco: { cep: "", logradouro: "Rua A, 10", bairro: "" } }),
      { cep: "49100065", logradouro: "Rua A, 10", bairro: "Centro", origem: "LOGRADOURO" },
    );

    assert.deepEqual(mudancas?.endereco, { cep: "49100065", logradouro: "Rua A, 10", bairro: "Centro" });
  });

  it("nome fantasia que só tem espaços vira null", () => {
    const mudancas = planejarNormalizacao(
      empresa({ nomeFantasia: "   " }),
      semMudancaDeEndereco("49100000", "Rua A, 10", "Centro"),
    );

    assert.equal(mudancas?.nomeFantasia, null);
  });

  it("nunca apaga razão social nem atividade", () => {
    const mudancas = planejarNormalizacao(
      empresa({ razaoSocial: "   ", atividadePrincipal: "  " }),
      null,
    );

    assert.equal(mudancas, null);
  });
});
