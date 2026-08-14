import { CreditCard } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard";
import { InvoiceHistoryCard } from "@/components/billing/InvoiceHistoryCard";
import { SubscriptionHistoryCard } from "@/components/billing/SubscriptionHistoryCard";
import { QuickActionsCard } from "@/components/billing/QuickActionsCard";

export function BillingPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing management
          </SheetTitle>
          <SheetDescription>
            Manage your subscription, payment methods, and billing history.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex-1 space-y-6 overflow-y-auto pr-1">
          <CurrentPlanCard />

          <QuickActionsCard />

          <SubscriptionHistoryCard />

          <InvoiceHistoryCard />
        </div>
      </SheetContent>
    </Sheet>
  );
}
