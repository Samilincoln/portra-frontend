import { apiFetch } from "@/lib/auth";

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
