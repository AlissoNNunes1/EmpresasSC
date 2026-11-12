import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { encontrarPossiveisDuplicatas, type RegistroComparavel } from "./duplicatas";

const registro = (overrides: Partial<RegistroComparavel> & Pick<RegistroComparavel, "ref" | "nome">): RegistroComparavel => ({
  cnpj: "",
  telefone: "",
  logradouro: "",
  ...overrides,
});

describe("encontrarPossiveisDuplicatas", () => {
  it("aponta empresa com mesmo nome e mesmo telefone, mesmo que o sufixo legal mude", () => {
    const novo = registro({ ref: "linha 2", nome: "Restaurante Sabor da Casa", telefone: "99899 4493" });
    const existente = registro({ ref: "empresa #7", nome: "Restaurante Sabor da Casa Ltda", telefone: "(98) 99899-4493" });

    const [par] = encontrarPossiveisDuplicatas([novo], [existente]);

    assert.equal(par?.a.ref, "linha 2");
    assert.equal(par?.b.ref, "empresa #7");
    assert.ok(par?.motivos.includes("mesmo telefone"));
  });

  it("não aponta empresas diferentes que apenas dividem bairro e nome genérico", () => {
    const novo = registro({ ref: "linha 2", nome: "Padaria Central", logradouro: "Rua A, 10" });
    const existente = registro({ ref: "empresa #9", nome: "Farmácia Santa Rita", logradouro: "Rua B, 500" });

    assert.deepEqual(encontrarPossiveisDuplicatas([novo], [existente]), []);
  });

  it("nome só parecido, sem telefone nem endereço iguais, não é apontado", () => {
    const novo = registro({ ref: "linha 2", nome: "Mercearia Silva", telefone: "99111 1111", logradouro: "Rua A, 1" });
    const existente = registro({ ref: "empresa #3", nome: "Mercearia Silveira", telefone: "98222 2222", logradouro: "Av. Z, 99" });

    assert.deepEqual(encontrarPossiveisDuplicatas([novo], [existente]), []);
  });

  it("filiais com sufixo diferente (LA x MD) sem telefone nem endereço iguais não são apontadas", () => {
    const novo = registro({ ref: "linha 2", nome: "Mercearia Itabaiana LA", telefone: "99111 1111", logradouro: "Rua A, 1" });
    const existente = registro({ ref: "empresa #5", nome: "Mercearia Itabaiana MD", telefone: "98222 2222", logradouro: "Av. Z, 99" });

    assert.deepEqual(encontrarPossiveisDuplicatas([novo], [existente]), []);
  });

  it("pares com o mesmo CNPJ são atualizações e não duplicatas", () => {
    const novo = registro({ ref: "linha 2", cnpj: "18258018000153", nome: "Mercado Exemplo" });
    const existente = registro({ ref: "empresa #1", cnpj: "18258018000153", nome: "Mercado Exemplo" });

    assert.deepEqual(encontrarPossiveisDuplicatas([novo], [existente]), []);
  });

  it("compara linhas do próprio arquivo entre si, sem repetir o par", () => {
    const linhas = [
      registro({ ref: "linha 2", nome: "Lar Azul Gastrô", logradouro: "Rua Ivo do Prado, 58" }),
      registro({ ref: "linha 3", nome: "Restaurante Lar Azul", logradouro: "Rua Ivo do Prado, 58" }),
    ];

    const encontrados = encontrarPossiveisDuplicatas(linhas, []);

    assert.equal(encontrados.length, 1);
    assert.deepEqual([encontrados[0].a.ref, encontrados[0].b.ref], ["linha 2", "linha 3"]);
  });
});
