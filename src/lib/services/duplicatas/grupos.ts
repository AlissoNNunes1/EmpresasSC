// Agrupa pares de possíveis duplicatas em grupos: se A~B e B~C, então A, B e C estão no mesmo grupo.

/** Chave estável de um par, independente da ordem dos ids. */
export function chaveDoPar(idA: number, idB: number): string {
  return idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
}

/** Componentes conexos do grafo de pares (union-find). Cada grupo vem com ids ordenados. */
export function agruparPorComponente(pares: ReadonlyArray<{ a: number; b: number }>): number[][] {
  const pai = new Map<number, number>();

  const garantir = (id: number) => {
    if (!pai.has(id)) pai.set(id, id);
  };

  const raiz = (id: number): number => {
    let atual = id;
    while (pai.get(atual) !== atual) atual = pai.get(atual)!;
    return atual;
  };

  for (const { a, b } of pares) {
    garantir(a);
    garantir(b);
    const raizA = raiz(a);
    const raizB = raiz(b);
    if (raizA !== raizB) pai.set(raizA, raizB);
  }

  const porRaiz = new Map<number, number[]>();
  for (const id of pai.keys()) {
    const r = raiz(id);
    porRaiz.set(r, [...(porRaiz.get(r) ?? []), id]);
  }

  return [...porRaiz.values()]
    .map((ids) => [...ids].sort((x, y) => x - y))
    .sort((x, y) => x[0] - y[0]);
}
