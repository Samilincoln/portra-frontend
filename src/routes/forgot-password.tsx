import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthCard, FieldError, FormError } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
});

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — Portra" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await authFetch("/api/v1/auth/forgot-password", parsed.data);
      setSent(true);
    } catch (err) {
      const e = err as { message?: string };
      setFormError(e.message ?? "Unable to send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={sent ? "Check your inbox" : "Reset your password"}
      subtitle={
        sent
          ? undefined
          : "Enter your email and we'll send you a link to reset your password."
      }
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>,
            you'll receive a reset link shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={formError} />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
              disabled={loading}
            />
            <FieldError message={error} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
