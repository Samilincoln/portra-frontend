import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  CreditCard,
  History,
  XCircle,
} from "lucide-react";

import { getSubscriptionHistory, type SubscriptionHistoryEvent } from "@/lib/billing";

const EVENT_CONFIG: Record<
  string,
  { icon: typeof ArrowUp; color: string; label: string }
> = {
  upgrade: { icon: ArrowUp, color: "text-green-500", label: "Upgraded" },
  downgrade: { icon: ArrowDown, color: "text-amber-500", label: "Downgraded" },
  renewal: { icon: CreditCard, color: "text-blue-500", label: "Renewed" },
  cancellation: { icon: XCircle, color: "text-destructive", label: "Cancelled" },
  payment: { icon: CreditCard, color: "text-accent", label: "Payment" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SubscriptionHistoryCard() {
  const historyQuery = useQuery({
    queryKey: ["billing", "subscription-history"],
    queryFn: () => getSubscriptionHistory(),
  });

  const events = historyQuery.data?.events ?? [];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold tracking-tight">Subscription History</h2>
      </div>

      <div className="mt-5">
        {historyQuery.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 py-8 text-center">
            <History className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No subscription history yet.</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
            {events.map((event: SubscriptionHistoryEvent) => {
              const config = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.payment;
              const Icon = config.icon;
              return (
                <div key={event.id} className="relative flex items-start gap-4 py-3">
                  <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border border-border`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{config.label}</span>
                      <span className="text-sm text-muted-foreground capitalize">{event.plan}</span>
                      {event.amount > 0 && (
                        <span className="text-sm text-muted-foreground">
                          — {event.currency === "NGN" ? "₦" : "$"}
                          {(event.amount / 100).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
