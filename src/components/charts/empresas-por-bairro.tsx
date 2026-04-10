"use client";

import {
    Bar,
    BarChart,
  Cell,
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
  "#1b3383", "#2a4ba6", "#3a5db9", "#4a6ec9",
  "#5a7dd9", "#6a8de9", "#7a9df9", "#0f1f4d",
  "#2d5a8c", "#4a7db9", "#67a0e6", "#84c3ff",
];

export function EmpresasPorBairro({ data }: { data: BairroData[] }) {
  if (!data.length) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-600">
        Ainda nao ha dados de bairro para exibir.
      </div>
    );
  }

  // Seleciona top 10 bairros e ordena por valor
  const chartData = [...data]
    .sort((a, b) => b.totalEmpresas - a.totalEmpresas)
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }));

  // Renderiza valor ao lado da barra
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    return (
      <text
        x={x + width + 4}
        y={y + height / 2}
        fill="#1b3383"
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={600}
      >
        {value}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="font-semibold text-[#1b3383]">
            {payload[0].payload.bairro}
          </p>
          <p className="text-sm text-slate-700">
            {payload[0].value} empresa{payload[0].value !== 1 ? "s" : ""}
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
          margin={{ left: 92, right: 56, top: 6, bottom: 6 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={false}
          />
          <XAxis type="number" allowDecimals={false} stroke="#cbd5e1" />
          <YAxis
            dataKey="bairro"
            type="category"
            width={95}
            tick={{ fontSize: 11, fill: "#64748b" }}
            stroke="#cbd5e1"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="totalEmpresas"
            radius={[0, 8, 8, 0]}
            animationDuration={800}
            label={renderCustomLabel}
            maxBarSize={38}
          >
            {chartData.map((entry) => (
              <Cell key={entry.bairro} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
