"use client";

import { X } from "lucide-react";

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function UsuarioModal({ title, open, onClose, children }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-semibold text-[#1b3383]">{title}</h3>
          <button
            type="button"
            className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
