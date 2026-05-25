"use client";

export default function MapaEmpresaPopup({ empresa }: { empresa: { id: number; razaoSocial: string; camposCustom?: Array<{ campo: { label: string }; valor: string }> } }) {
  return (
    <div className="max-w-xs">
      <h4 className="text-sm font-semibold">{empresa.razaoSocial}</h4>
      <div className="mt-1 text-xs text-slate-600">
        {empresa.camposCustom && empresa.camposCustom.length > 0 ? (
          <ul className="space-y-1 mt-2">
            {empresa.camposCustom.map((c, idx) => (
              <li key={idx}><span className="font-medium">{c.campo.label}:</span> <span className="ml-1">{c.valor}</span></li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">Sem informações adicionais.</p>
        )}
      </div>
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
///    \___ \___ ) \/ (
//\_/\_(____(____|____/
