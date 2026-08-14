import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Check, CreditCard, ExternalLink, Loader2, Receipt, Settings, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { TIERS, type TierId, getTier, formatLimit, formatPlanDisplayText } from "@/lib/plans";
import {
  getSubscriptionTier,
  getInvoices,
  createCheckoutSession,
  verifyPayment,
  type SubscriptionTierResponse,
  type Invoice,
} from "@/lib/billing";
import { BillingPanel } from "@/components/billing/BillingPanel";

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;

function getFlutterwaveCallbackUrl(plan: string) {
  return `${window.location.origin}/dashboard/settings?tab=billing&payment=success&provider=flutterwave&plan=${plan}`;
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  past_due: { label: "Past due", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const INVOICE_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  success: { label: "Paid", variant: "default" },
  pending: { label: "Pending", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "secondary" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BillingTab({ profile }: { profile?: { subscriptionTier?: string } }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const subQuery = useQuery({
    queryKey: ["billing", "subscription-tier"],
    queryFn: () => getSubscriptionTier(),
  });

  const invoicesQuery = useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: () => getInvoices(),
  });

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TierId | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"paystack" | "flutterwave">("paystack");
  const [billingOpen, setBillingOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const reference = params.get("reference");
    const provider = params.get("provider");
    const plan = params.get("plan");

    if (payment === "success" && reference && provider) {
      setBillingOpen(true);
      verifyPayment(reference, provider)
        .then(() => {
          const planLabel = plan === "pro" ? "Pro" : plan === "consultant" ? "Consultant" : "";
          toast.success(planLabel ? `Payment verified! Welcome to ${planLabel}.` : "Payment verified! Your plan has been activated.");
          qc.invalidateQueries({ queryKey: ["billing", "subscription-tier"] });
          qc.invalidateQueries({ queryKey: ["billing", "invoices"] });
          qc.invalidateQueries({ queryKey: ["billing", "subscription-history"] });
          qc.invalidateQueries({ queryKey: ["me"] });
        })
        .catch(() => {
          toast.error("Could not verify payment. Please contact support.");
        })
        .finally(() => {
          window.history.replaceState({}, "", window.location.pathname + "?tab=billing");
        });
    }
  }, [qc]);

  function openPaystackPopup(data: { access_code?: string; reference: string; provider: string; amount?: number }, plan: TierId) {
    const Pop = window.PaystackPop;
    if (!Pop) {
      toast.error("Payment system not loaded. Please refresh.");
      return;
    }
    const pop = Pop.setup({
      key: PAYSTACK_KEY,
      email: user?.email ?? "",
      amount: data.amount ?? 0,
      ref: data.reference,
      access_code: data.access_code,
      onClose: () => {
        toast.info("Payment cancelled.");
      },
      callback: (response: { reference: string }) => {
        verifyPayment(response.reference, data.provider)
          .then(() => {
            const planLabel = plan === "pro" ? "Pro" : plan === "consultant" ? "Consultant" : "";
            toast.success(planLabel ? `Payment verified! Welcome to ${planLabel}.` : "Payment verified! Your plan has been activated.");
            qc.invalidateQueries({ queryKey: ["billing", "subscription-tier"] });
            qc.invalidateQueries({ queryKey: ["billing", "invoices"] });
            qc.invalidateQueries({ queryKey: ["me"] });
          })
          .catch(() => {
            toast.error("Could not verify payment. Please contact support.");
          });
      },
    });
    pop.openIframe();
  }

  const checkoutMutation = useMutation({
    mutationFn: (plan: TierId) =>
      createCheckoutSession({
        plan,
        provider: selectedProvider,
        callback_url: getFlutterwaveCallbackUrl(plan),
      }),
    onSuccess: (data) => {
      setUpgradeOpen(false);
      if (selectedProvider === "paystack" && data.access_code && selectedPlan) {
        openPaystackPopup(data, selectedPlan);
      } else if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message ?? "Could not start checkout");
    },
  });

  function handleUpgrade(plan: TierId) {
    setSelectedPlan(plan);
    setUpgradeOpen(true);
  }

  const sub = subQuery.data;
  const tierId = (sub?.tier as TierId) ?? (profile?.subscriptionTier as TierId) ?? "free";
  const currentTier = getTier(tierId);
  const invoices = subQuery.data ? (invoicesQuery.data?.invoices ?? []) : [];
  const statusInfo = sub?.status ? (STATUS_MAP[sub.status] ?? null) : null;
  const isPaid = sub != null && sub.tier !== "free" && sub.status != null;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{currentTier.label} plan</h2>
              {statusInfo ? (
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              ) : (
                <Badge variant="secondary">Free</Badge>
              )}
            </div>
            {sub?.end_date ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(sub.end_date) > new Date()
                  ? `Renews on ${formatDate(sub.end_date)}`
                  : `Expired on ${formatDate(sub.end_date)}`}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">You're on the {formatPlanDisplayText(tierId)}.</p>
            )}
          </div>
          {isPaid && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setBillingOpen(true)}
            >
              <Settings className="h-3.5 w-3.5" />
              Manage billing
            </Button>
          )}
        </div>
      </section>

      {/* Plan Comparison */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-semibold tracking-tight">Plans</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose the plan that fits your needs.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {(Object.keys(TIERS) as TierId[]).map((id) => {
            const t = TIERS[id];
            const isCurrent = id === tierId;
            const isDowngrade =
              (tierId === "consultant" && id === "pro") ||
              (tierId === "consultant" && id === "free") ||
              (tierId === "pro" && id === "free");
            return (
              <div
                key={id}
                className={`relative flex flex-col rounded-xl border p-5 transition-colors ${
                  isCurrent ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                }`}
              >
                {isCurrent && (
                  <Badge variant="default" className="absolute -top-2.5 right-4 text-[10px]">
                    Current plan
                  </Badge>
                )}
                <div>
                  <h3 className="text-base font-semibold">{t.label}</h3>
                  <p className="mt-1 text-2xl font-bold">{t.price}</p>
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                  {[
                    { label: "Portfolios", value: t.profiles },
                    { label: "Projects", value: t.projects },
                    { label: "Blog posts", value: t.blogPosts },
                    { label: "Experiences", value: t.experiences },
                    { label: "Skills", value: t.skills },
                    { label: "Storage", value: t.storage },
                  ].map((f) => (
                    <li key={f.label} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>
                        {f.label}: {typeof f.value === "number" ? formatLimit(f.value) : f.value}
                      </span>
                    </li>
                  ))}
                  {t.customDomain && (
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>Custom domain</span>
                    </li>
                  )}
                  {t.aiFeatures && (
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>AI features</span>
                    </li>
                  )}
                  {t.analytics && (
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>Analytics</span>
                    </li>
                  )}
                </ul>
                <div className="mt-5">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button variant="outline" className="w-full" disabled>
                      Downgrade
                    </Button>
                  ) : (
                    <Button className="w-full gap-1.5" onClick={() => handleUpgrade(id)}>
                      <Zap className="h-3.5 w-3.5" />
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Invoice History */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Invoices</h2>
        </div>
        <div className="mt-5">
          {invoicesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No invoices yet. Upgrade to a paid plan to see your billing history here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: Invoice) => {
                  const invStatus = INVOICE_STATUS_MAP[inv.status] ?? INVOICE_STATUS_MAP.pending;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>{formatDate(inv.date)}</TableCell>
                      <TableCell>
                        {inv.currency === "NGN" ? "₦" : "$"}
                        {(inv.amount / 100).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="capitalize">{inv.plan}</TableCell>
                      <TableCell>
                        <Badge variant={invStatus.variant}>{invStatus.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {inv.receipt_url ? (
                          <a
                            href={inv.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                          >
                            Download <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan ? TIERS[selectedPlan].label : ""}</DialogTitle>
            <DialogDescription>
              Choose your preferred payment provider to complete the upgrade.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <button
              type="button"
              onClick={() => setSelectedProvider("paystack")}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                selectedProvider === "paystack"
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/40"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0047FF] text-white text-xs font-bold">
                PS
              </div>
              <div>
                <p className="text-sm font-medium">Paystack</p>
                <p className="text-xs text-muted-foreground">Card, Bank, USSD</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSelectedProvider("flutterwave")}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                selectedProvider === "flutterwave"
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/40"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5A623] text-white text-xs font-bold">
                FW
              </div>
              <div>
                <p className="text-sm font-medium">Flutterwave</p>
                <p className="text-xs text-muted-foreground">Card, Mobile Money</p>
              </div>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={checkoutMutation.isPending}
              onClick={() => {
                if (selectedPlan) checkoutMutation.mutate(selectedPlan);
              }}
            >
              {checkoutMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-1.5 h-4 w-4" />
              )}
              Continue to payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Billing Management Panel */}
      <BillingPanel open={billingOpen} onOpenChange={setBillingOpen} />
    </div>
  );
}
