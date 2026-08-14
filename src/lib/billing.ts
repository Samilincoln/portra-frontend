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

export async function getSubscriptionTier(): Promise<SubscriptionTierResponse> {
  return apiFetch<SubscriptionTierResponse>("/api/v1/subscription/tier");
}

export async function getInvoices(): Promise<InvoiceListResponse> {
  return apiFetch<InvoiceListResponse>("/api/v1/billing/invoices");
}

export async function createCheckoutSession(
  body: {
    plan: string;
    provider: "paystack" | "flutterwave";
    callback_url: string;
  },
): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>("/api/v1/billing/checkout", {
    method: "POST",
    body,
  });
}

export async function createPortalSession(): Promise<PortalResponse> {
  return apiFetch<PortalResponse>("/api/v1/billing/portal", {
    method: "POST",
    body: {},
  });
}

export async function verifyPayment(
  reference: string,
  provider: string,
): Promise<VerifyResponse> {
  return apiFetch<VerifyResponse>("/api/v1/billing/verify", {
    method: "POST",
    body: { reference, provider },
  });
}
