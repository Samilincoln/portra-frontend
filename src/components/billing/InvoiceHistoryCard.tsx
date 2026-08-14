import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInvoices, type Invoice } from "@/lib/billing";

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

export function InvoiceHistoryCard() {
  const invoicesQuery = useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: () => getInvoices(),
  });

  const invoices = invoicesQuery.data?.invoices ?? [];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold tracking-tight">Invoice History</h2>
      </div>

      <div className="mt-5">
        {invoicesQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 py-8 text-center">
            <Receipt className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No invoices yet.</p>
          </div>
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
  );
}
