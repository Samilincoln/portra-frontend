import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, HelpCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createPortalSession } from "@/lib/billing";

export function QuickActionsCard() {
  const portalMutation = useMutation({
    mutationFn: createPortalSession,
    onSuccess: (data) => {
      if (data.portal_url) window.open(data.portal_url, "_blank");
    },
    onError: (err: { message?: string }) => toast.error(err?.message ?? "Could not open billing portal"),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your billing account and get help.
      </p>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          disabled={portalMutation.isPending}
          onClick={() => portalMutation.mutate()}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:opacity-50"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            {portalMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ExternalLink className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Open billing portal</p>
            <p className="text-xs text-muted-foreground">
              Update payment methods, view invoices, and manage your subscription.
            </p>
          </div>
        </button>

        <a
          href="mailto:support@portra.app"
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent/5"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Contact support</p>
            <p className="text-xs text-muted-foreground">
              Get help with billing, subscriptions, or account issues.
            </p>
          </div>
        </a>
      </div>
    </section>
  );
}
