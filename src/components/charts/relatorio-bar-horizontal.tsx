"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = [
  "#1b3383", "#2a4ba6", "#3a5db9", "#4a6ec9",
  "#5a7dd9", "#6a8de9", "#7a9df9", "#0f1f4d",
  "#2d5a8c", "#4a7db9", "#67a0e6", "#84c3ff",
];

type Props = {
  rows: Array<{ label: string; value: number }>;
  metricaLabel: string;
};

export function RelatorioBarHorizontal({ rows, metricaLabel }: Props) {
  if (!rows.length) return null;

  const chartData = rows
    .slice(0, 15)
    .map((r, i) => ({ ...r, fill: COLORS[i % COLORS.length] }));

  const renderLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    return (
      <text x={x + width + 4} y={y + height / 2} fill="#1b3383" textAnchor="start" dominantBaseline="middle" fontSize={11} fontWeight={600}>
        {typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
        <p className="font-semibold text-[#1b3383]">{payload[0].payload.label}</p>
        <p className="text-sm text-slate-700">{payload[0].value} {metricaLabel.toLowerCase()}</p>
      </div>
    );
  };

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 92, right: 56, top: 6, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis type="number" allowDecimals={false} stroke="#cbd5e1" />
          <YAxis dataKey="label" type="category" width={95} tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={800} label={renderLabel} maxBarSize={38}>
            {chartData.map((entry) => <Cell key={entry.label} fill={entry.fill} />)}
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
