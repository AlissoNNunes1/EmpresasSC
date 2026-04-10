import type { CategoriaOption } from "@/types/empresa";

type Filtros = {
  termo?: string;
  categoriaId?: number;
  bairro?: string;
  porte?: "MEI" | "MICRO" | "PEQUENA" | "MEDIA" | "GRANDE";
  situacao?: "ATIVA" | "INATIVA" | "SUSPENSA" | "ENCERRADA";
  minEmpregados?: number;
  maxEmpregados?: number;
};

type Props = {
  filtros: Filtros;
  categorias: CategoriaOption[];
};

export function EmpresaFiltros({ filtros, categorias }: Props) {
  return (
    <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <input name="termo" defaultValue={filtros.termo} className="h-10 rounded-md border border-slate-300 px-3" placeholder="Razao social, fantasia ou CNPJ" />
      <select name="categoriaId" defaultValue={filtros.categoriaId} className="h-10 rounded-md border border-slate-300 px-3">
        <option value="">Todas categorias</option>
        {categorias.map((categoria) => (
          <option key={categoria.id} value={categoria.id}>
            {categoria.nome}
          </option>
        ))}
      </select>
      <input name="bairro" defaultValue={filtros.bairro} className="h-10 rounded-md border border-slate-300 px-3" placeholder="Bairro" />
      <select name="porte" defaultValue={filtros.porte} className="h-10 rounded-md border border-slate-300 px-3">
        <option value="">Todos portes</option>
        <option value="MEI">MEI</option>
        <option value="MICRO">Micro</option>
        <option value="PEQUENA">Pequena</option>
        <option value="MEDIA">Media</option>
        <option value="GRANDE">Grande</option>
      </select>
      <input name="minEmpregados" type="number" min={0} defaultValue={filtros.minEmpregados} className="h-10 rounded-md border border-slate-300 px-3" placeholder="Minimo empregados" />
      <input name="maxEmpregados" type="number" min={0} defaultValue={filtros.maxEmpregados} className="h-10 rounded-md border border-slate-300 px-3" placeholder="Maximo empregados" />
      <select name="situacao" defaultValue={filtros.situacao} className="h-10 rounded-md border border-slate-300 px-3">
        <option value="">Todas situacoes</option>
        <option value="ATIVA">Ativa</option>
        <option value="INATIVA">Inativa</option>
        <option value="SUSPENSA">Suspensa</option>
        <option value="ENCERRADA">Encerrada</option>
      </select>
      <button type="submit" className="h-10 rounded-md bg-sky-700 px-4 text-white hover:bg-sky-800">
        Aplicar filtros
      </button>
    </form>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
