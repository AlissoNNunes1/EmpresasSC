"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CategoriaData = {
  categoria: string;
  totalEmpresas: number;
};

// Paleta de cores institucional (gradiente)
const COLORS = [
  "#1b3383", // Primária
  "#2a4ba6",
  "#3a5db9",
  "#4a6ec9",
  "#5a7dd9",
  "#6a8de9",
  "#0f1f4d",
  "#2d5a8c",
  "#4a7db9",
];

export function EmpresasPorCategoria({ data }: { data: CategoriaData[] }) {
  // Aplica cores gradualmente
  const chartData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-white p-3 shadow-lg">
          <p className="text-sm font-semibold text-[#1b3383]">
            {payload[0].payload.categoria}
          </p>
          <p className="text-sm text-slate-700">
            {payload[0].value} empresas
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 8, bottom: 64 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="categoria"
            angle={-20}
            textAnchor="end"
            interval={0}
            height={80}
            tick={{ fontSize: 12 }}
            stroke="#94a3b8"
          />
          <YAxis allowDecimals={false} stroke="#94a3b8" />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="totalEmpresas"
            fill="#1b3383"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
