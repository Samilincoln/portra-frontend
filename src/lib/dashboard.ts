import { apiFetch } from "@/lib/auth";

export type DashboardStats = {
  total_projects: number;
  projects_this_month: number;
  published_projects: number;
  published_this_week: number;
  total_blog_posts: number;
  draft_blog_posts: number;
  profile_views_total: number;
  profile_views_change_pct: number;
};

export async function getDashboardStats(token: string | null): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/api/v1/dashboard/stats", token);
}
