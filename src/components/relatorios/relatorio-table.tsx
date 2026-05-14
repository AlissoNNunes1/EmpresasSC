"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Props = {
  rows: Array<{ label: string; value: number }>;
  metricaLabel: string;
  groupByLabel: string;
  total: number;
};

export function RelatorioTable({ rows, metricaLabel, groupByLabel, total }: Props) {
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead className="w-10 text-slate-400">#</TableHead>
            <TableHead>{groupByLabel}</TableHead>
            <TableHead className="text-right">{metricaLabel}</TableHead>
            <TableHead className="text-right">% do Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:nth-child(even)]:bg-slate-50/50">
          {rows.map((row, i) => (
            <TableRow key={row.label}>
              <TableCell className="text-xs tabular-nums text-slate-400">{i + 1}</TableCell>
              <TableCell className="font-medium text-slate-800">{row.label}</TableCell>
              <TableCell className="text-right tabular-nums text-slate-700">
                {typeof row.value === "number" && !Number.isInteger(row.value)
                  ? row.value.toFixed(1)
                  : row.value}
              </TableCell>
              <TableCell className="text-right tabular-nums text-slate-500">
                {total > 0 ? ((row.value / total) * 100).toFixed(1) : "0.0"}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
