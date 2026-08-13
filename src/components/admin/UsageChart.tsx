import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AiUsageDaily } from "@/lib/admin";

export function UsageChart({ data }: { data: AiUsageDaily[] }) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    cost: Number(d.total_cost.toFixed(4)),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
          }}
          formatter={(value: number, name: string) => {
            if (name === "total_calls") return [value.toLocaleString(), "Calls"];
            if (name === "cost") return [`$${value.toFixed(4)}`, "Cost"];
            return [value, name];
          }}
        />
        <Bar
          dataKey="total_calls"
          fill="hsl(262 83% 58%)"
          radius={[4, 4, 0, 0]}
          name="total_calls"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
