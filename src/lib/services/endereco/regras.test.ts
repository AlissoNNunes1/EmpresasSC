import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  completarEndereco,
  escolherCandidatoPorLogradouro,
  nomeDaViaParaBusca,
  normalizarCep,
  pertenceAoMunicipioPadrao,
  type BuscadoresEndereco,
  type EnderecoCep,
} from "./regras";

const enderecoDoCep = (overrides: Partial<EnderecoCep>): EnderecoCep => ({
  cep: "49100000",
  logradouro: "",
  bairro: "",
  municipio: "São Cristóvão",
  uf: "SE",
  ...overrides,
});

const buscadoresFalsos = (porCep: EnderecoCep | null, porLogradouro: EnderecoCep | null): BuscadoresEndereco => ({
  porCep: async () => porCep,
  porLogradouro: async () => porLogradouro,
});

describe("pertenceAoMunicipioPadrao", () => {
  it("aceita São Cristóvão/SE, ignorando acento e caixa", () => {
    assert.equal(pertenceAoMunicipioPadrao({ municipio: "SAO CRISTOVAO", uf: "se" }), true);
  });

  it("rejeita outra cidade, mesmo com o mesmo nome em outro estado", () => {
    assert.equal(pertenceAoMunicipioPadrao({ municipio: "Sarandi", uf: "PR" }), false);
    assert.equal(pertenceAoMunicipioPadrao({ municipio: "São Cristóvão", uf: "SC" }), false);
  });
});

describe("normalizarCep", () => {
  it("aceita CEP formatado e completa zeros à esquerda", () => {
    assert.equal(normalizarCep("4910-000"), "04910000");
    assert.equal(normalizarCep("49100-000"), "49100000");
  });

  it("rejeita vazio, zerado e com mais de 8 dígitos", () => {
    assert.equal(normalizarCep(""), "");
    assert.equal(normalizarCep("00000-000"), "");
    assert.equal(normalizarCep("491000001"), "");
  });
});

describe("nomeDaViaParaBusca", () => {
  it("remove tipo de via e número da porta", () => {
    assert.equal(nomeDaViaParaBusca("Rua Ivo do Prado, 25"), "Ivo do Prado");
    assert.equal(nomeDaViaParaBusca("Av. Pastor José R. Sobrinho, 804"), "Pastor José R. Sobrinho");
  });

  it("remove número no fim sem vírgula e marcador s/n", () => {
    assert.equal(nomeDaViaParaBusca("Rua Horácio Souza Lima, s/n"), "Horácio Souza Lima");
    assert.equal(nomeDaViaParaBusca("Rua Exemplo 25"), "Exemplo");
  });

  it("retorna vazio quando só sobra o tipo de via", () => {
    assert.equal(nomeDaViaParaBusca("Rua 83, n. 10"), "83");
    assert.equal(nomeDaViaParaBusca("Rua"), "");
  });
});

describe("escolherCandidatoPorLogradouro", () => {
  const candidatos: EnderecoCep[] = [
    enderecoDoCep({ cep: "49100065", logradouro: "Avenida Ivo do Prado", bairro: "Centro" }),
    enderecoDoCep({ cep: "49100111", logradouro: "Rua Ivo do Prado", bairro: "Divineia" }),
  ];

  it("usa o bairro para escolher entre CEPs da mesma via", () => {
    const escolhido = escolherCandidatoPorLogradouro(candidatos, "Rua Ivo do Prado, 25", "Centro");
    assert.equal(escolhido?.cep, "49100065");
  });

  it("sem bairro e com CEPs diferentes, é ambíguo e não escolhe", () => {
    assert.equal(escolherCandidatoPorLogradouro(candidatos, "Rua Ivo do Prado", ""), null);
  });

  it("bairro informado que não bate com nenhum candidato não escolhe", () => {
    assert.equal(escolherCandidatoPorLogradouro(candidatos, "Rua Ivo do Prado", "Rosa Elze"), null);
  });

  it("via com um único CEP é escolhida sem bairro", () => {
    const unico = [enderecoDoCep({ cep: "49105344", logradouro: "Rua A", bairro: "Eduardo Gomes" })];
    assert.equal(escolherCandidatoPorLogradouro(unico, "Rua A", "")?.cep, "49105344");
  });
});

describe("completarEndereco", () => {
  it("por CEP: preenche logradouro e bairro vazios", async () => {
    const resultado = await completarEndereco(
      { cep: "49100-000", logradouro: "", bairro: "" },
      buscadoresFalsos(enderecoDoCep({ logradouro: "Rua João Bebe Água", bairro: "Centro" }), null),
    );

    assert.deepEqual(resultado, { cep: "49100000", logradouro: "Rua João Bebe Água", bairro: "Centro", origem: "CEP" });
  });

  it("nunca sobrescreve valor informado, nem o placeholder tratado como vazio", async () => {
    const resultado = await completarEndereco(
      { cep: "49100000", logradouro: "Rua Digitada, 5", bairro: "Não informado" },
      buscadoresFalsos(enderecoDoCep({ logradouro: "Rua Oficial", bairro: "Centro" }), null),
    );

    assert.equal(resultado.logradouro, "Rua Digitada, 5");
    assert.equal(resultado.bairro, "Centro");
  });

  it("sem CEP: busca pelo logradouro e preenche o CEP", async () => {
    const resultado = await completarEndereco(
      { cep: "", logradouro: "Rua Ivo do Prado, 25", bairro: "Centro" },
      buscadoresFalsos(null, enderecoDoCep({ cep: "49100065", bairro: "Centro" })),
    );

    assert.deepEqual(resultado, { cep: "49100065", logradouro: "Rua Ivo do Prado, 25", bairro: "Centro", origem: "LOGRADOURO" });
  });

  it("CEP não encontrado mantém a entrada original", async () => {
    const entrada = { cep: "49199999", logradouro: "Rua X", bairro: "Y" };
    const resultado = await completarEndereco(entrada, buscadoresFalsos(null, null));

    assert.deepEqual(resultado, { ...entrada, origem: null });
  });
});
