import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  CreditCard,
  Loader2,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import {
  TIERS,
  type TierId,
  getTier,
  formatLimit,
  formatPlanDisplayText,
  getNextTier,
} from "@/lib/plans";
import {
  getSubscriptionTier,
  createCheckoutSession,
  cancelSubscription,
  downgradeSubscription,
  verifyPayment,
  type SubscriptionTierResponse,
} from "@/lib/billing";

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  past_due: { label: "Past due", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

function getFlutterwaveCallbackUrl(plan: string) {
  return `${window.location.origin}/dashboard/settings?tab=billing&payment=success&provider=flutterwave&plan=${plan}`;
}

export function CurrentPlanCard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const subQuery = useQuery({
    queryKey: ["billing", "subscription-tier"],
    queryFn: () => getSubscriptionTier(),
  });

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [downgradeOpen, setDowngradeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TierId | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"paystack" | "flutterwave">("paystack");
  const [cancelReason, setCancelReason] = useState("");

  const sub = subQuery.data;
  const tierId = (sub?.tier as TierId) ?? "free";
  const currentTier = getTier(tierId);
  const statusInfo = sub?.status ? STATUS_MAP[sub.status] ?? null : null;
  const isPaid = sub != null && sub.tier !== "free" && sub.status != null;
  const nextTier = getNextTier(tierId);

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
      onClose: () => toast.info("Payment cancelled."),
      callback: (response: { reference: string }) => {
        verifyPayment(response.reference, data.provider)
          .then(() => {
            toast.success(`Payment verified! Welcome to ${TIERS[plan].label}.`);
            qc.invalidateQueries({ queryKey: ["billing", "subscription-tier"] });
            qc.invalidateQueries({ queryKey: ["billing", "invoices"] });
            qc.invalidateQueries({ queryKey: ["billing", "subscription-history"] });
            qc.invalidateQueries({ queryKey: ["me"] });
          })
          .catch(() => toast.error("Could not verify payment. Please contact support."));
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
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not start checkout"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscription(cancelReason),
    onSuccess: () => {
      toast.success("Subscription cancelled.");
      setCancelOpen(false);
      qc.invalidateQueries({ queryKey: ["billing", "subscription-tier"] });
      qc.invalidateQueries({ queryKey: ["billing", "subscription-history"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not cancel subscription"),
  });

  const downgradeMutation = useMutation({
    mutationFn: (plan: string) => downgradeSubscription(plan),
    onSuccess: () => {
      toast.success("Plan downgraded successfully.");
      setDowngradeOpen(false);
      qc.invalidateQueries({ queryKey: ["billing", "subscription-tier"] });
      qc.invalidateQueries({ queryKey: ["billing", "subscription-history"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not downgrade plan"),
  });

  const usageItems = [
    { label: "Portfolios", used: sub?.profile_count ?? 0, limit: sub?.profile_limit ?? 1 },
    { label: "Storage", used: 0, limit: sub?.storage_limit_bytes ?? 0, format: true },
  ];

  return (
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
                ? `Renews on ${new Date(sub.end_date).toLocaleDateString()}`
                : `Expired on ${new Date(sub.end_date).toLocaleDateString()}`}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              You're on the {formatPlanDisplayText(tierId)}.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isPaid && (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href="https://portra.app/pricing" target="_blank" rel="noopener noreferrer">
                <CreditCard className="h-3.5 w-3.5" />
                Manage billing
              </a>
            </Button>
          )}
          {nextTier && (
            <Button size="sm" className="gap-1.5" onClick={() => { setSelectedPlan(nextTier); setUpgradeOpen(true); }}>
              <ArrowUp className="h-3.5 w-3.5" />
              Upgrade to {TIERS[nextTier].label}
            </Button>
          )}
          {isPaid && tierId !== "free" && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDowngradeOpen(true)}>
              <ArrowDown className="h-3.5 w-3.5" />
              Downgrade
            </Button>
          )}
        </div>
      </div>

      {/* Usage Meters */}
      <div className="mt-6 space-y-4">
        {usageItems.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">
                {item.used} / {item.format ? `${(item.limit / 1024 / 1024).toFixed(0)} MB` : formatLimit(item.limit)}
              </span>
            </div>
            <Progress
              value={item.limit > 0 ? (item.used / item.limit) * 100 : 0}
              className="mt-1.5 h-2"
            />
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {Object.entries(currentTier)
          .filter(([key]) => ["customDomain", "aiFeatures", "analytics"].includes(key))
          .map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <Check className={`h-3.5 w-3.5 ${value ? "text-accent" : "text-muted-foreground/40"}`} />
              <span className={value ? "text-foreground" : "text-muted-foreground"}>
                {key === "customDomain" ? "Custom domain" : key === "aiFeatures" ? "AI features" : "Analytics"}
              </span>
            </div>
          ))}
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan ? TIERS[selectedPlan].label : ""}</DialogTitle>
            <DialogDescription>Choose your preferred payment provider.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <button
              type="button"
              onClick={() => setSelectedProvider("paystack")}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                selectedProvider === "paystack" ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0047FF] text-white text-xs font-bold">PS</div>
              <div>
                <p className="text-sm font-medium">Paystack</p>
                <p className="text-xs text-muted-foreground">Card, Bank, USSD</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSelectedProvider("flutterwave")}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                selectedProvider === "flutterwave" ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5A623] text-white text-xs font-bold">FW</div>
              <div>
                <p className="text-sm font-medium">Flutterwave</p>
                <p className="text-xs text-muted-foreground">Card, Mobile Money</p>
              </div>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>Cancel</Button>
            <Button
              disabled={checkoutMutation.isPending}
              onClick={() => { if (selectedPlan) checkoutMutation.mutate(selectedPlan); }}
            >
              {checkoutMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Zap className="mr-1.5 h-4 w-4" />}
              Continue to payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade Dialog */}
      <Dialog open={downgradeOpen} onOpenChange={setDowngradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Downgrade plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to downgrade? You'll lose access to some features at the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Downgrading will remove:</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {tierId === "consultant" && (
                    <>
                      <li>- Reduced portfolio limit (from 10 to 3)</li>
                      <li>- Reduced storage (from 10 GB to 1 GB)</li>
                    </>
                  )}
                  {tierId === "pro" && (
                    <>
                      <li>- Reduced portfolio limit (from 3 to 1)</li>
                      <li>- Reduced storage (from 1 GB to 50 MB)</li>
                      <li>- Custom domain access</li>
                      <li>- AI features</li>
                      <li>- Analytics</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDowngradeOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={downgradeMutation.isPending}
              onClick={() => {
                const downgradeTarget = tierId === "consultant" ? "pro" : "free";
                downgradeMutation.mutate(downgradeTarget);
              }}
            >
              {downgradeMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Confirm downgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel subscription</DialogTitle>
            <DialogDescription>
              Your subscription will remain active until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Reason for cancelling (optional)</label>
            <Select value={cancelReason} onValueChange={setCancelReason}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="too_expensive">Too expensive</SelectItem>
                <SelectItem value="not_using">Not using it enough</SelectItem>
                <SelectItem value="missing_features">Missing features</SelectItem>
                <SelectItem value="switching">Switching to another tool</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep subscription</Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Cancel subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
