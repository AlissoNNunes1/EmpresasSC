"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#1b3383", "#2a4ba6", "#3a5db9", "#4a6ec9",
  "#5a7dd9", "#6a8de9", "#0f1f4d", "#2d5a8c", "#4a7db9",
];

type Props = {
  rows: Array<{ label: string; value: number }>;
  metricaLabel: string;
  total: number;
};

export function RelatorioPie({ rows, metricaLabel, total }: Props) {
  if (!rows.length) return null;

  const chartData = rows.map((r, i) => ({
    name: r.label,
    value: r.value,
    fill: COLORS[i % COLORS.length],
    pct: total > 0 ? ((r.value / total) * 100).toFixed(1) : "0.0",
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
        <p className="font-semibold text-[#1b3383]">{d.name}</p>
        <p className="text-sm text-slate-700">{d.value} {metricaLabel.toLowerCase()} · {d.pct}%</p>
      </div>
    );
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {payload.map((entry: any, index: number) => (
          <li key={index} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            {entry.value} ({chartData.find((d) => d.name === entry.value)?.pct}%)
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={110}
            paddingAngle={2}
            animationDuration={800}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
