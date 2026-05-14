"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = [
  "#1b3383", "#2a4ba6", "#3a5db9", "#4a6ec9",
  "#5a7dd9", "#6a8de9", "#0f1f4d", "#2d5a8c", "#4a7db9",
];

type Props = {
  rows: Array<{ label: string; value: number }>;
  metricaLabel: string;
};

export function RelatorioBarVertical({ rows, metricaLabel }: Props) {
  if (!rows.length) return null;

  const chartData = rows.map((r, i) => ({ ...r, fill: COLORS[i % COLORS.length] }));

  const renderLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text x={x + width / 2} y={y - 5} fill="#1b3383" textAnchor="middle" fontSize={12} fontWeight={600}>
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
        <BarChart data={chartData} margin={{ top: 28, right: 8, left: 8, bottom: 68 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal vertical={false} />
          <XAxis dataKey="label" angle={-40} textAnchor="end" interval={0} height={100} tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={800} label={renderLabel} maxBarSize={56}>
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
