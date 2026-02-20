"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

type Item = { workflowStatus: string; count: number };

export function ChartByWorkflowStatus({ data }: { data: Item[] }) {
  return (
    <div className="h-[260px] w-full" role="img" aria-label="Agendamentos por status de fluxo">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <XAxis
            dataKey="workflowStatus"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
            allowDecimals={false}
          />
          <Bar
            dataKey="count"
            name="Quantidade"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
