import { apiFetch } from "@/lib/auth";

// ── AI Usage (GET /admin/ai-usage) ──────────────────────────────────────────

export type AiUsageByEndpoint = {
  endpoint: string;
  action: string;
  total_calls: number;
  success_calls: number;
  failed_calls: number;
  total_tokens: number;
  total_cost: number;
  avg_latency_ms: number;
};

export type AiUsageByProvider = {
  provider: string;
  total_calls: number;
  total_tokens: number;
  total_cost: number;
};

export type AiUsageByUser = {
  user_id: string;
  user_email: string;
  user_name: string;
  total_calls: number;
  total_tokens: number;
  total_cost: number;
};

export type AiUsageDaily = {
  date: string;
  total_calls: number;
  total_tokens: number;
  total_cost: number;
};

export type AiUsageResponse = {
  total_calls: number;
  total_tokens: number;
  total_cost: number;
  avg_latency_ms: number;
  by_endpoint: AiUsageByEndpoint[];
  by_provider: AiUsageByProvider[];
  by_user: AiUsageByUser[];
  daily_usage: AiUsageDaily[];
};

export async function getAiUsage(
  token: string | null,
  days: number = 30,
): Promise<AiUsageResponse> {
  return apiFetch<AiUsageResponse>(
    `/api/v1/admin/ai-usage?days=${days}`,
    token,
  );
}

// ── Platform Stats (GET /admin/stats) ───────────────────────────────────────

export type TierDistribution = {
  tier: string;
  count: number;
  percentage: number;
};

export type SignupTrend = {
  date: string;
  count: number;
};

export type PlatformStats = {
  total_users: number;
  active_users: number;
  new_users_period: number;
  verified_users: number;
  tier_distribution: TierDistribution[];
  signup_trend: SignupTrend[];
};

export async function getPlatformStats(
  token: string | null,
  days: number = 30,
): Promise<PlatformStats> {
  return apiFetch<PlatformStats>(
    `/api/v1/admin/stats?days=${days}`,
    token,
  );
}

// ── Admin User List (GET /admin/users) ──────────────────────────────────────

export type AdminUserListItem = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  subscription_tier: string;
  subscription_status: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  profile_count: number;
  project_count: number;
};

export type AdminUserListResponse = {
  users: AdminUserListItem[];
  total: number;
};

export async function getAdminUsers(
  token: string | null,
  days: number = 30,
): Promise<AdminUserListResponse> {
  return apiFetch<AdminUserListResponse>(
    `/api/v1/admin/users?days=${days}`,
    token,
  );
}

// ── Content Stats (GET /admin/content-stats) ────────────────────────────────

export type PublishedVsDraft = {
  published_projects: number;
  draft_projects: number;
  published_blogs: number;
  draft_blogs: number;
};

export type ContentTrendItem = {
  date: string;
  profiles: number;
  projects: number;
  blog_posts: number;
};

export type ContentStats = {
  total_profiles: number;
  total_projects: number;
  total_blog_posts: number;
  total_experiences: number;
  total_skills: number;
  total_testimonials: number;
  published_vs_draft: PublishedVsDraft;
  content_trend: ContentTrendItem[];
};

export async function getContentStats(
  token: string | null,
  days: number = 30,
): Promise<ContentStats> {
  return apiFetch<ContentStats>(
    `/api/v1/admin/content-stats?days=${days}`,
    token,
  );
}

// ── Admin Profile List (GET /admin/profiles) ────────────────────────────────

export type AdminProfileListItem = {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  user_email: string;
  user_name: string;
  is_default: boolean;
  project_count: number;
  blog_count: number;
  created_at: string;
};

export type AdminProfileListResponse = {
  profiles: AdminProfileListItem[];
  total: number;
};

export async function getAdminProfiles(
  token: string | null,
  days: number = 30,
): Promise<AdminProfileListResponse> {
  return apiFetch<AdminProfileListResponse>(
    `/api/v1/admin/profiles?days=${days}`,
    token,
  );
}

// ── Feature Usage (GET /admin/feature-usage) ────────────────────────────────

export type FeatureUsageByTierBreakdown = {
  endpoint: string;
  action: string;
  total_calls: number;
  total_tokens: number;
};

export type FeatureUsageByTier = {
  tier: string;
  total_calls: number;
  total_tokens: number;
  total_cost: number;
  breakdown: FeatureUsageByTierBreakdown[];
};

export type FeatureUsageByFeature = {
  endpoint: string;
  action: string;
  total_calls: number;
  success_rate: number;
  avg_latency_ms: number;
  tier_usage: Record<string, number>;
};

export type FeatureUsageResponse = {
  by_tier: FeatureUsageByTier[];
  by_feature: FeatureUsageByFeature[];
};

export async function getFeatureUsage(
  token: string | null,
  days: number = 30,
): Promise<FeatureUsageResponse> {
  return apiFetch<FeatureUsageResponse>(
    `/api/v1/admin/feature-usage?days=${days}`,
    token,
  );
}

// ── OAuth Stats (GET /admin/oauth-stats) ────────────────────────────────────

export type OAuthProviderStat = {
  provider: string;
  count: number;
};

export type RecentOAuthLink = {
  user_email: string;
  provider: string;
  created_at: string;
};

export type OAuthStatsResponse = {
  total_linked: number;
  by_provider: OAuthProviderStat[];
  users_with_no_oauth: number;
  recent_links: RecentOAuthLink[];
};

export async function getOAuthStats(
  token: string | null,
  days: number = 30,
): Promise<OAuthStatsResponse> {
  return apiFetch<OAuthStatsResponse>(
    `/api/v1/admin/oauth-stats?days=${days}`,
    token,
  );
}

// ── Social Shares (GET /admin/social-shares) ────────────────────────────────

export type SocialSharePlatformStat = {
  platform: string;
  count: number;
};

export type SocialShareTrend = {
  date: string;
  linkedin: number;
  twitter: number;
};

export type SocialSharesResponse = {
  total_shares: number;
  by_platform: SocialSharePlatformStat[];
  share_trend: SocialShareTrend[];
};

export async function getSocialShares(
  token: string | null,
  days: number = 30,
): Promise<SocialSharesResponse> {
  return apiFetch<SocialSharesResponse>(
    `/api/v1/admin/social-shares?days=${days}`,
    token,
  );
}

// ── Subscription Stats (GET /admin/subscriptions) ───────────────────────────

export type SubscriptionTierCount = {
  tier: string;
  count: number;
  percentage: number;
};

export type SubscriptionStatusCount = {
  status: string;
  count: number;
};

export type SubscriptionTrend = {
  date: string;
  new: number;
  cancelled: number;
};

export type SubscriptionStatsResponse = {
  total_subscribers: number;
  active_subscriptions: number;
  cancelled_period: number;
  tier_distribution: SubscriptionTierCount[];
  status_distribution: SubscriptionStatusCount[];
  churn_rate: number;
  subscription_trend: SubscriptionTrend[];
};

export async function getSubscriptionStats(
  token: string | null,
  days: number = 30,
): Promise<SubscriptionStatsResponse> {
  return apiFetch<SubscriptionStatsResponse>(
    `/api/v1/admin/subscriptions?days=${days}`,
    token,
  );
}

// ── Revenue Stats (GET /admin/revenue) ──────────────────────────────────────

export type RevenueByProvider = {
  provider: string;
  count: number;
  total_amount: number;
};

export type RevenueTrend = {
  date: string;
  amount: number;
  count: number;
};

export type RecentPayment = {
  id: string;
  user_email: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  provider: string;
  created_at: string;
};

export type RevenueStatsResponse = {
  total_revenue: number;
  total_revenue_formatted: number;
  currency: string;
  successful_payments: number;
  failed_payments: number;
  by_provider: RevenueByProvider[];
  revenue_trend: RevenueTrend[];
  recent_payments: RecentPayment[];
};

export async function getRevenueStats(
  token: string | null,
  days: number = 30,
): Promise<RevenueStatsResponse> {
  return apiFetch<RevenueStatsResponse>(
    `/api/v1/admin/revenue?days=${days}`,
    token,
  );
}
