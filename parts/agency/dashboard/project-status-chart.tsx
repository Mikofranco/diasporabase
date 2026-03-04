"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  active: "#0ea5e9",
  approved: "#3b82f6",
  completed: "#22c55e",
  rejected: "#ef4444",
  cancelled: "#f97316",
};

export interface ProjectStatusChartProps {
  statusCounts: {
    pending: number;
    active: number;
    approved?: number;
    completed: number;
    rejected: number;
    cancelled: number;
  };
}

export function ProjectStatusChart({ statusCounts }: ProjectStatusChartProps) {
  const data = [
    { name: "Pending", value: statusCounts.pending, color: STATUS_COLORS.pending },
    { name: "Active", value: statusCounts.active, color: STATUS_COLORS.active },
    ...(typeof statusCounts.approved === "number" && statusCounts.approved > 0
      ? [{ name: "Approved", value: statusCounts.approved, color: STATUS_COLORS.approved }]
      : []),
    { name: "Completed", value: statusCounts.completed, color: STATUS_COLORS.completed },
    { name: "Rejected", value: statusCounts.rejected, color: STATUS_COLORS.rejected },
    { name: "Cancelled", value: statusCounts.cancelled, color: STATUS_COLORS.cancelled },
  ].filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            Project Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground text-sm">
            <p>No projects yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          Project Status Overview
        </CardTitle>
        {/* <Link
          href={routes.agencyAnalytics}
          className="text-sm text-diaspora-blue hover:underline"
        >
          View full analytics
        </Link> */}
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  const pct = total ? ((d.value / total) * 100).toFixed(1) : "0";
                  return (
                    <div className="rounded-lg border bg-white px-3 py-2 text-sm shadow-md">
                      <span className="font-medium">{d.name}:</span> {d.value} ({pct}%)
                    </div>
                  );
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
