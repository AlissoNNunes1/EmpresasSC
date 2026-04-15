"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type CategoriaData = {
  categoria: string;
  totalEmpresas: number;
};

// Paleta de cores institucional com gradiente
const COLORS = [
  "#1b3383", "#2a4ba6", "#3a5db9", "#4a6ec9",
  "#5a7dd9", "#6a8de9", "#0f1f4d", "#2d5a8c", "#4a7db9",
];

export function EmpresasPorCategoria({ data }: { data: CategoriaData[] }) {
  if (!data.length) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-600">
        Ainda não há dados de categoria para exibir.
      </div>
    );
  }

  // Aplica cores e ordena por valor
  const chartData = [...data]
    .sort((a, b) => b.totalEmpresas - a.totalEmpresas)
    .map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }));

  // Renderiza valor no topo da barra
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#1b3383"
        textAnchor="middle"
        fontSize={12}
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
            {payload[0].payload.categoria}
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
        <BarChart data={chartData} margin={{ top: 28, right: 8, left: 8, bottom: 68 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="categoria"
            angle={-40}
            textAnchor="end"
            interval={0}
            height={100}
            tick={{ fontSize: 11, fill: "#64748b" }}
            stroke="#cbd5e1"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            stroke="#cbd5e1"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="totalEmpresas"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
            label={renderCustomLabel}
            maxBarSize={56}
          >
            {chartData.map((entry) => (
              <Cell key={entry.categoria} fill={entry.fill} />
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
