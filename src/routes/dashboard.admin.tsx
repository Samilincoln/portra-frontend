import React, { Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Activity,
  Coins,
  Clock,
  BarChart3,
  Users,
  LayoutGrid,
  Puzzle,
  Link,
  CreditCard,
  Bot,
  UserPlus,
  FolderOpen,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Share2,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  getAiUsage,
  getPlatformStats,
  getAdminUsers,
  getContentStats,
  getAdminProfiles,
  getFeatureUsage,
  getOAuthStats,
  getSocialShares,
  getSubscriptionStats,
  getRevenueStats,
  type AiUsageResponse,
  type PlatformStats,
  type AdminUserListResponse,
  type ContentStats,
  type AdminProfileListResponse,
  type FeatureUsageResponse,
  type OAuthStatsResponse,
  type SocialSharesResponse,
  type SubscriptionStatsResponse,
  type RevenueStatsResponse,
} from "@/lib/admin";

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

const TABS = [
  { value: "users", label: "Users", icon: Users },
  { value: "portfolios", label: "Portfolios", icon: LayoutGrid },
  { value: "features", label: "Features", icon: Puzzle },
  { value: "social", label: "Social", icon: Link },
  { value: "billing", label: "Billing", icon: CreditCard },
  { value: "ai-usage", label: "AI Usage", icon: Bot },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  const value = amount / 100;
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatTokens(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCost(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(n: number) {
  return `${n.toFixed(1)}%`;
}

function formatDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatCards({
  isLoading,
  cards,
}: {
  isLoading: boolean;
  cards: { label: string; value: string; icon: React.ElementType; color: string; bg: string }[];
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
            <div className={`${c.bg} rounded-lg p-2`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function LoadingRows({ count, cols }: { count: number; cols: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={99} className="py-12 text-center text-sm text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}

function AdminPage() {
  useAuth();
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState("users");

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
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

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              <t.icon className="mr-1.5 h-4 w-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="users">
          <UsersTab days={days} />
        </TabsContent>
        <TabsContent value="portfolios">
          <PortfoliosTab days={days} />
        </TabsContent>
        <TabsContent value="features">
          <FeaturesTab days={days} />
        </TabsContent>
        <TabsContent value="social">
          <SocialTab days={days} />
        </TabsContent>
        <TabsContent value="billing">
          <BillingAnalyticsTab days={days} />
        </TabsContent>
        <TabsContent value="ai-usage">
          <AiUsageTab days={days} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── AI Usage Tab ────────────────────────────────────────────────────────────

function AiUsageTab({ days }: { days: number }) {
  const query = useQuery({
    queryKey: ["admin-ai-usage", days],
    queryFn: () => getAiUsage(days),
  });

  const data = query.data;

  return (
    <div className="space-y-8">
      <StatCards
        isLoading={query.isLoading}
        cards={
          data
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
            : []
        }
      />

      <SectionCard title="Usage by Endpoint">
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
            {query.isLoading ? (
              <LoadingRows count={4} cols={8} />
            ) : !data?.by_endpoint?.length ? (
              <EmptyState message="No data available." />
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
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Usage by Provider">
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
              {query.isLoading ? (
                <LoadingRows count={3} cols={4} />
              ) : !data?.by_provider?.length ? (
                <EmptyState message="No data available." />
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
        </SectionCard>

        <SectionCard title="Usage by User">
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
              {query.isLoading ? (
                <LoadingRows count={3} cols={4} />
              ) : !data?.by_user?.length ? (
                <EmptyState message="No data available." />
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
        </SectionCard>
      </div>

      <SectionCard title="Daily Usage">
        <div className="p-6">
          {query.isLoading ? (
            <Skeleton className="h-[300px] w-full rounded" />
          ) : !data?.daily_usage?.length ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No data available.</p>
          ) : (
            <Suspense fallback={<Skeleton className="h-[300px] w-full rounded" />}>
              <LazyUsageChart data={data.daily_usage} />
            </Suspense>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ── Users Tab ───────────────────────────────────────────────────────────────

function UsersTab({ days }: { days: number }) {
  const statsQuery = useQuery({
    queryKey: ["admin-stats", days],
    queryFn: () => getPlatformStats(days),
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users", days],
    queryFn: () => getAdminUsers(days),
  });

  const stats = statsQuery.data;
  const users = usersQuery.data;
  const isLoading = statsQuery.isLoading || usersQuery.isLoading;

  return (
    <div className="space-y-8">
      <StatCards
        isLoading={isLoading}
        cards={
          stats
            ? [
                {
                  label: "Total Users",
                  value: stats.total_users.toLocaleString(),
                  icon: Users,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Active Users",
                  value: stats.active_users.toLocaleString(),
                  icon: Activity,
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/10",
                },
                {
                  label: "New Signups",
                  value: stats.new_users_period.toLocaleString(),
                  icon: UserPlus,
                  color: "text-violet-500",
                  bg: "bg-violet-500/10",
                },
                {
                  label: "Verified",
                  value: stats.verified_users.toLocaleString(),
                  icon: CheckCircle,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                },
              ]
            : []
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Users by Tier">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingRows count={3} cols={3} />
              ) : !stats?.tier_distribution?.length ? (
                <EmptyState message="No data available." />
              ) : (
                stats.tier_distribution.map((t) => (
                  <TableRow key={t.tier}>
                    <TableCell className="font-medium capitalize">
                      <Badge variant="outline" className="capitalize">
                        {t.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{t.count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{t.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Signup Trend">
          <div className="p-6">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full rounded" />
            ) : !stats?.signup_trend?.length ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data available.</p>
            ) : (
              <Suspense fallback={<Skeleton className="h-[200px] w-full rounded" />}>
                <LazyUsageChart
                  data={stats.signup_trend.map((d) => ({
                    date: d.date,
                    total_calls: d.count,
                    total_tokens: 0,
                    total_cost: 0,
                  }))}
                />
              </Suspense>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="All Users">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Profiles</TableHead>
              <TableHead className="text-right">Projects</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingRows count={5} cols={6} />
            ) : !users?.users?.length ? (
              <EmptyState message="No users found." />
            ) : (
              users.users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{u.name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {u.subscription_tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{u.profile_count}</TableCell>
                  <TableCell className="text-right">{u.project_count}</TableCell>
                  <TableCell>
                    {u.is_active ? (
                      <Badge variant="outline" className="text-emerald-600">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(u.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

// ── Portfolios Tab ──────────────────────────────────────────────────────────

function PortfoliosTab({ days }: { days: number }) {
  const contentQuery = useQuery({
    queryKey: ["admin-content-stats", days],
    queryFn: () => getContentStats(days),
  });

  const profilesQuery = useQuery({
    queryKey: ["admin-profiles", days],
    queryFn: () => getAdminProfiles(days),
  });

  const content = contentQuery.data;
  const profiles = profilesQuery.data;
  const isLoading = contentQuery.isLoading || profilesQuery.isLoading;

  return (
    <div className="space-y-8">
      <StatCards
        isLoading={isLoading}
        cards={
          content
            ? [
                {
                  label: "Profiles",
                  value: content.total_profiles.toLocaleString(),
                  icon: LayoutGrid,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Projects",
                  value: content.total_projects.toLocaleString(),
                  icon: FolderOpen,
                  color: "text-violet-500",
                  bg: "bg-violet-500/10",
                },
                {
                  label: "Blog Posts",
                  value: content.total_blog_posts.toLocaleString(),
                  icon: Star,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                },
                {
                  label: "Testimonials",
                  value: content.total_testimonials.toLocaleString(),
                  icon: Star,
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/10",
                },
              ]
            : []
        }
      />

      {content && (
        <SectionCard title="Published vs Draft">
          <div className="grid grid-cols-2 gap-4 p-6">
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Published Projects</p>
              <p className="mt-1 text-2xl font-semibold">{content.published_vs_draft.published_projects}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Draft Projects</p>
              <p className="mt-1 text-2xl font-semibold">{content.published_vs_draft.draft_projects}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Published Blogs</p>
              <p className="mt-1 text-2xl font-semibold">{content.published_vs_draft.published_blogs}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Draft Blogs</p>
              <p className="mt-1 text-2xl font-semibold">{content.published_vs_draft.draft_blogs}</p>
            </div>
          </div>
        </SectionCard>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Experiences">
          <div className="p-6">
            <p className="text-3xl font-semibold">{content?.total_experiences.toLocaleString() ?? "—"}</p>
          </div>
        </SectionCard>
        <SectionCard title="Skills">
          <div className="p-6">
            <p className="text-3xl font-semibold">{content?.total_skills.toLocaleString() ?? "—"}</p>
          </div>
        </SectionCard>
        <SectionCard title="Content Trend">
          <div className="p-6">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full rounded" />
            ) : !content?.content_trend?.length ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data available.</p>
            ) : (
              <Suspense fallback={<Skeleton className="h-[200px] w-full rounded" />}>
                <LazyUsageChart
                  data={content.content_trend.map((d) => ({
                    date: d.date,
                    total_calls: d.projects + d.blog_posts,
                    total_tokens: 0,
                    total_cost: 0,
                  }))}
                />
              </Suspense>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="All Profiles">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profile</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Projects</TableHead>
              <TableHead className="text-right">Blogs</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingRows count={5} cols={6} />
            ) : !profiles?.profiles?.length ? (
              <EmptyState message="No profiles found." />
            ) : (
              profiles.profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">/{p.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{p.user_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{p.user_email}</p>
                  </TableCell>
                  <TableCell className="text-right">{p.project_count}</TableCell>
                  <TableCell className="text-right">{p.blog_count}</TableCell>
                  <TableCell>
                    {p.is_default ? (
                      <Badge variant="outline" className="text-amber-600">Default</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(p.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

// ── Features Tab ────────────────────────────────────────────────────────────

function FeaturesTab({ days }: { days: number }) {
  const query = useQuery({
    queryKey: ["admin-features", days],
    queryFn: () => getFeatureUsage(days),
  });

  const data = query.data;

  return (
    <div className="space-y-8">
      <StatCards
        isLoading={query.isLoading}
        cards={
          data
            ? [
                {
                  label: "Total Features",
                  value: data.by_feature.length.toLocaleString(),
                  icon: Puzzle,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Most Used",
                  value: data.by_feature?.[0]?.action ?? "—",
                  icon: Star,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                },
              ]
            : []
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Usage by Tier">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <LoadingRows count={3} cols={4} />
              ) : !data?.by_tier?.length ? (
                <EmptyState message="No data available." />
              ) : (
                data.by_tier.map((t) => (
                  <TableRow key={t.tier}>
                    <TableCell className="font-medium capitalize">
                      <Badge variant="outline" className="capitalize">
                        {t.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{t.total_calls.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatTokens(t.total_tokens)}</TableCell>
                    <TableCell className="text-right">{formatCost(t.total_cost)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Feature Breakdown">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Success Rate</TableHead>
                <TableHead className="text-right">Avg Latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <LoadingRows count={4} cols={4} />
              ) : !data?.by_feature?.length ? (
                <EmptyState message="No data available." />
              ) : (
                data.by_feature.map((f) => (
                  <TableRow key={`${f.endpoint}-${f.action}`}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{f.action}</p>
                        <p className="text-xs text-muted-foreground font-mono">{f.endpoint}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{f.total_calls.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={f.success_rate >= 0.9 ? "text-emerald-600" : "text-amber-600"}>
                        {(f.success_rate * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {(f.avg_latency_ms / 1000).toFixed(1)}s
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Social Tab ──────────────────────────────────────────────────────────────

function SocialTab({ days }: { days: number }) {
  const oauthQuery = useQuery({
    queryKey: ["admin-oauth", days],
    queryFn: () => getOAuthStats(days),
  });

  const sharesQuery = useQuery({
    queryKey: ["admin-shares", days],
    queryFn: () => getSocialShares(days),
  });

  const oauth = oauthQuery.data;
  const shares = sharesQuery.data;
  const isLoading = oauthQuery.isLoading || sharesQuery.isLoading;

  return (
    <div className="space-y-8">
      <StatCards
        isLoading={isLoading}
        cards={
          oauth
            ? [
                {
                  label: "Linked Accounts",
                  value: oauth.total_linked.toLocaleString(),
                  icon: Link,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Unlinked Users",
                  value: oauth.users_with_no_oauth.toLocaleString(),
                  icon: Users,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                },
                {
                  label: "Total Shares",
                  value: shares?.total_shares.toLocaleString() ?? "—",
                  icon: Share2,
                  color: "text-violet-500",
                  bg: "bg-violet-500/10",
                },
                {
                  label: "Platforms",
                  value: shares?.by_platform.length.toString() ?? "—",
                  icon: ExternalLink,
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/10",
                },
              ]
            : []
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="OAuth by Provider">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Connections</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingRows count={4} cols={2} />
              ) : !oauth?.by_provider?.length ? (
                <EmptyState message="No data available." />
              ) : (
                oauth.by_provider.map((p) => (
                  <TableRow key={p.provider}>
                    <TableCell className="font-medium capitalize">{p.provider}</TableCell>
                    <TableCell className="text-right">{p.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Shares by Platform">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">Shares</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingRows count={3} cols={2} />
              ) : !shares?.by_platform?.length ? (
                <EmptyState message="No data available." />
              ) : (
                shares.by_platform.map((p) => (
                  <TableRow key={p.platform}>
                    <TableCell className="font-medium capitalize">{p.platform}</TableCell>
                    <TableCell className="text-right">{p.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SectionCard>
      </div>

      <SectionCard title="Recent OAuth Links">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Linked At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingRows count={5} cols={3} />
            ) : !oauth?.recent_links?.length ? (
              <EmptyState message="No recent links." />
            ) : (
              oauth.recent_links.map((l, i) => (
                <TableRow key={`${l.user_email}-${i}`}>
                  <TableCell className="text-sm">{l.user_email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{l.provider}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(l.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Share Trend">
        <div className="p-6">
          {isLoading ? (
            <Skeleton className="h-[200px] w-full rounded" />
          ) : !shares?.share_trend?.length ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No data available.</p>
          ) : (
            <Suspense fallback={<Skeleton className="h-[200px] w-full rounded" />}>
              <LazyUsageChart
                data={shares.share_trend.map((d) => ({
                  date: d.date,
                  total_calls: d.linkedin + d.twitter,
                  total_tokens: 0,
                  total_cost: 0,
                }))}
              />
            </Suspense>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ── Billing Tab ─────────────────────────────────────────────────────────────

function BillingAnalyticsTab({ days }: { days: number }) {
  const subsQuery = useQuery({
    queryKey: ["admin-subscriptions", days],
    queryFn: () => getSubscriptionStats(days),
  });

  const revenueQuery = useQuery({
    queryKey: ["admin-revenue", days],
    queryFn: () => getRevenueStats(days),
  });

  const subs = subsQuery.data;
  const revenue = revenueQuery.data;
  const isLoading = subsQuery.isLoading || revenueQuery.isLoading;

  return (
    <div className="space-y-8">
      <StatCards
        isLoading={isLoading}
        cards={
          subs && revenue
            ? [
                {
                  label: "Active Subscriptions",
                  value: subs.active_subscriptions.toLocaleString(),
                  icon: CreditCard,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Total Revenue",
                  value: formatCurrency(revenue.total_revenue),
                  icon: Coins,
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/10",
                },
                {
                  label: "Churn Rate",
                  value: formatPercent(subs.churn_rate),
                  icon: TrendingUp,
                  color: "text-red-500",
                  bg: "bg-red-500/10",
                },
                {
                  label: "Failed Payments",
                  value: revenue.failed_payments.toLocaleString(),
                  icon: XCircle,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                },
              ]
            : []
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Subscriptions by Tier">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Subscribers</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingRows count={3} cols={3} />
              ) : !subs?.tier_distribution?.length ? (
                <EmptyState message="No data available." />
              ) : (
                subs.tier_distribution.map((t) => (
                  <TableRow key={t.tier}>
                    <TableCell className="font-medium capitalize">
                      <Badge variant="outline" className="capitalize">
                        {t.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{t.count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{t.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Subscription Status">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingRows count={3} cols={2} />
              ) : !subs?.status_distribution?.length ? (
                <EmptyState message="No data available." />
              ) : (
                subs.status_distribution.map((s) => (
                  <TableRow key={s.status}>
                    <TableCell className="font-medium capitalize">{s.status}</TableCell>
                    <TableCell className="text-right">{s.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SectionCard>
      </div>

      <SectionCard title="Revenue by Provider">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead className="text-right">Payments</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingRows count={3} cols={3} />
            ) : !revenue?.by_provider?.length ? (
              <EmptyState message="No data available." />
            ) : (
              revenue.by_provider.map((p) => (
                <TableRow key={p.provider}>
                  <TableCell className="font-medium capitalize">{p.provider}</TableCell>
                  <TableCell className="text-right">{p.count.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.total_amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Subscription Trend">
        <div className="p-6">
          {isLoading ? (
            <Skeleton className="h-[200px] w-full rounded" />
          ) : !subs?.subscription_trend?.length ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No data available.</p>
          ) : (
            <Suspense fallback={<Skeleton className="h-[200px] w-full rounded" />}>
              <LazyUsageChart
                data={subs.subscription_trend.map((d) => ({
                  date: d.date,
                  total_calls: d.new - d.cancelled,
                  total_tokens: 0,
                  total_cost: 0,
                }))}
              />
            </Suspense>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Recent Payments">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingRows count={5} cols={6} />
            ) : !revenue?.recent_payments?.length ? (
              <EmptyState message="No recent payments." />
            ) : (
              revenue.recent_payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{p.user_email}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{p.plan}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{p.provider}</TableCell>
                  <TableCell>
                    {p.status === "success" ? (
                      <Badge variant="outline" className="text-emerald-600">Success</Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-500">{p.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(p.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
