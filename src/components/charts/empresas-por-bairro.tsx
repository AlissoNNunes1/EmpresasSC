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

type BairroData = {
  bairro: string;
  totalEmpresas: number;
};

// Paleta de cores institucional
const COLORS = [
  "#1b3383", // Primária
  "#2a4ba6",
  "#3a5db9",
  "#4a6ec9",
  "#5a7dd9",
  "#6a8de9",
  "#7a9df9",
  "#0f1f4d", // Dark
  "#2d5a8c",
  "#4a7db9",
  "#67a0e6",
  "#84c3ff",
];

export function EmpresasPorBairro({ data }: { data: BairroData[] }) {
  // Seleciona até 12 bairros e aplica cores
  const chartData = data.slice(0, 12).map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-white p-3 shadow-lg">
          <p className="text-sm font-semibold text-[#1b3383]">
            {payload[0].payload.bairro}
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
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 120, right: 16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={false}
          />
          <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
          <YAxis
            dataKey="bairro"
            type="category"
            width={115}
            stroke="#94a3b8"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="totalEmpresas"
            fill="#1b3383"
            radius={[0, 8, 8, 0]}
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
