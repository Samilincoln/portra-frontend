import React, { Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Activity,
  Coins,
  Clock,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { getMe } from "@/lib/users";
import { getAiUsage, type AiUsageResponse } from "@/lib/admin";

const LazyUsageChart = React.lazy(() =>
  import("@/components/admin/UsageChart").then((m) => ({ default: m.UsageChart })),
);

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin — Portra" }] }),
  component: AdminPage,
});

const RANGE_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "365d", days: 365 },
] as const;

function AdminPage() {
  const { token } = useAuth();
  const [days, setDays] = useState(30);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token),
  });

  const usageQuery = useQuery({
    queryKey: ["admin-ai-usage", days],
    queryFn: () => getAiUsage(token, days),
  });

  if (meQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (meQuery.data?.isAdmin !== true) {
    return (
      <div className="grid min-h-[400px] place-items-center text-center">
        <div>
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Access Denied</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You don&apos;t have admin privileges.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  const usage = usageQuery.data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="h-7 w-7" /> Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI usage analytics and platform overview.
          </p>
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.days}
              variant={days === opt.days ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(opt.days)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <SummaryCards data={usage} isLoading={usageQuery.isLoading} />

      <UsageByEndpoint data={usage} isLoading={usageQuery.isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <UsageByProvider data={usage} isLoading={usageQuery.isLoading} />
        <UsageByUser data={usage} isLoading={usageQuery.isLoading} />
      </div>

      <DailyUsageChart data={usage} isLoading={usageQuery.isLoading} />
    </div>
  );
}

function formatCost(cost: number): string {
  if (cost < 0.01) return "<$0.01";
  return `$${cost.toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

function SummaryCards({
  data,
  isLoading,
}: {
  data: AiUsageResponse | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-16" />
          </div>
        ))}
      </section>
    );
  }

  const cards = data
    ? [
        {
          label: "Total Calls",
          value: data.total_calls.toLocaleString(),
          icon: Activity,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
        },
        {
          label: "Total Tokens",
          value: formatTokens(data.total_tokens),
          icon: BarChart3,
          color: "text-violet-500",
          bg: "bg-violet-500/10",
        },
        {
          label: "Total Cost",
          value: formatCost(data.total_cost),
          icon: Coins,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        },
        {
          label: "Avg Latency",
          value: `${(data.avg_latency_ms / 1000).toFixed(1)}s`,
          icon: Clock,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
        },
      ]
    : [];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {c.label}
              </span>
              <div className={`grid h-9 w-9 place-items-center rounded-lg ${c.bg} ${c.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{c.value}</p>
          </div>
        );
      })}
    </section>
  );
}

function UsageByEndpoint({
  data,
  isLoading,
}: {
  data: AiUsageResponse | undefined;
  isLoading: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight">Usage by Endpoint</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Endpoint</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead className="text-right">Calls</TableHead>
            <TableHead className="text-right">Success</TableHead>
            <TableHead className="text-right">Failed</TableHead>
            <TableHead className="text-right">Tokens</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Avg Latency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : !data?.by_endpoint?.length ? (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                No data available.
              </TableCell>
            </TableRow>
          ) : (
            data.by_endpoint.map((ep) => (
              <TableRow key={`${ep.endpoint}-${ep.action}`}>
                <TableCell className="font-mono text-xs">{ep.endpoint}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {ep.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{ep.total_calls.toLocaleString()}</TableCell>
                <TableCell className="text-right text-emerald-600">
                  {ep.success_calls.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-red-500">
                  {ep.failed_calls > 0 ? ep.failed_calls.toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-right">{formatTokens(ep.total_tokens)}</TableCell>
                <TableCell className="text-right">{formatCost(ep.total_cost)}</TableCell>
                <TableCell className="text-right">
                  {(ep.avg_latency_ms / 1000).toFixed(1)}s
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

function UsageByProvider({
  data,
  isLoading,
}: {
  data: AiUsageResponse | undefined;
  isLoading: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight">Usage by Provider</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead className="text-right">Calls</TableHead>
            <TableHead className="text-right">Tokens</TableHead>
            <TableHead className="text-right">Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 4 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : !data?.by_provider?.length ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                No data available.
              </TableCell>
            </TableRow>
          ) : (
            data.by_provider.map((p) => (
              <TableRow key={p.provider}>
                <TableCell className="font-medium capitalize">{p.provider}</TableCell>
                <TableCell className="text-right">{p.total_calls.toLocaleString()}</TableCell>
                <TableCell className="text-right">{formatTokens(p.total_tokens)}</TableCell>
                <TableCell className="text-right">{formatCost(p.total_cost)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

function UsageByUser({
  data,
  isLoading,
}: {
  data: AiUsageResponse | undefined;
  isLoading: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight">Usage by User</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Calls</TableHead>
            <TableHead className="text-right">Tokens</TableHead>
            <TableHead className="text-right">Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 4 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : !data?.by_user?.length ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                No data available.
              </TableCell>
            </TableRow>
          ) : (
            data.by_user.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{u.user_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{u.user_email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">{u.total_calls.toLocaleString()}</TableCell>
                <TableCell className="text-right">{formatTokens(u.total_tokens)}</TableCell>
                <TableCell className="text-right">{formatCost(u.total_cost)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

function DailyUsageChart({
  data,
  isLoading,
}: {
  data: AiUsageResponse | undefined;
  isLoading: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight">Daily Usage</h2>
      </div>
      <div className="p-6">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full rounded" />
        ) : !data?.daily_usage?.length ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No data available.</p>
        ) : (
          <Suspense
            fallback={<Skeleton className="h-[300px] w-full rounded" />}
          >
            <LazyUsageChart data={data.daily_usage} />
          </Suspense>
        )}
      </div>
    </section>
  );
}
