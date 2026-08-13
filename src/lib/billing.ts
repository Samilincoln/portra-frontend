import { apiFetch } from "@/lib/auth";

export type SubscriptionTierResponse = {
  tier: string;
  status: "active" | "past_due" | "cancelled" | null;
  start_date: string | null;
  end_date: string | null;
  payment_provider: "paystack" | "flutterwave" | null;
  profile_limit: number;
  profile_count: number;
  content_limits: Record<string, number | null>;
  storage_limit_bytes: number;
  features: Record<string, boolean>;
};

export type Invoice = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "refunded";
  plan: string;
  receipt_url: string;
  provider: string;
};

export type InvoiceListResponse = {
  invoices: Invoice[];
  total: number;
};

export type CheckoutResponse = {
  checkout_url: string;
  reference: string;
  provider: string;
};

export type PortalResponse = {
  portal_url: string;
};

export type VerifyResponse = {
  success: boolean;
  message: string;
  subscription: {
    tier: string;
    status: string;
    start_date: string;
    end_date: string;
    payment_provider: string;
  };
};

export async function getSubscriptionTier(token: string | null): Promise<SubscriptionTierResponse> {
  return apiFetch<SubscriptionTierResponse>("/api/v1/subscription/tier", token);
}

export async function getInvoices(token: string | null): Promise<InvoiceListResponse> {
  return apiFetch<InvoiceListResponse>("/api/v1/billing/invoices", token);
}

export async function createCheckoutSession(
  token: string | null,
  body: {
    plan: string;
    provider: "paystack" | "flutterwave";
    callback_url: string;
  },
): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>("/api/v1/billing/checkout", token, {
    method: "POST",
    body,
  });
}

export async function createPortalSession(token: string | null): Promise<PortalResponse> {
  return apiFetch<PortalResponse>("/api/v1/billing/portal", token, {
    method: "POST",
    body: {},
  });
}

export async function verifyPayment(
  token: string | null,
  reference: string,
  provider: string,
): Promise<VerifyResponse> {
  return apiFetch<VerifyResponse>("/api/v1/billing/verify", token, {
    method: "POST",
    body: { reference, provider },
  });
}
