import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { agruparPorComponente, chaveDoPar } from "./grupos";

describe("chaveDoPar", () => {
  it("é a mesma qualquer que seja a ordem dos ids", () => {
    assert.equal(chaveDoPar(7, 3), "3-7");
    assert.equal(chaveDoPar(3, 7), "3-7");
  });
});

describe("agruparPorComponente", () => {
  it("junta pares encadeados num único grupo (transitividade)", () => {
    const grupos = agruparPorComponente([{ a: 1, b: 2 }, { a: 2, b: 3 }]);

    assert.deepEqual(grupos, [[1, 2, 3]]);
  });

  it("mantém grupos separados quando não há ligação entre eles", () => {
    const grupos = agruparPorComponente([{ a: 1, b: 2 }, { a: 10, b: 11 }]);

    assert.deepEqual(grupos, [[1, 2], [10, 11]]);
  });

  it("não duplica ids quando o mesmo par aparece mais de uma vez", () => {
    const grupos = agruparPorComponente([{ a: 4, b: 5 }, { a: 5, b: 4 }]);

    assert.deepEqual(grupos, [[4, 5]]);
  });

  it("sem pares, não há grupos", () => {
    assert.deepEqual(agruparPorComponente([]), []);
  });
});
