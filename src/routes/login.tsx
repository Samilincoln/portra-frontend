import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Github, Loader2 } from "lucide-react";
import { AuthCard, FieldError, FormError } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authFetch, useAuth, type AuthUser } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(8, { message: "At least 8 characters" }).max(200),
});

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Portra" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fe[issue.path[0] as string] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const data = await authFetch<{ token: string; user?: AuthUser }>(
        "/api/v1/auth/login",
        parsed.data,
      );
      setSession({ token: data.token, user: data.user ?? { email: parsed.data.email } });
      await router.invalidate();
      navigate({ to: "/dashboard" });
    } catch (err) {
      const e = err as { message?: string; fields?: Record<string, string> };
      setFormError(e.message ?? "Unable to sign in");
      if (e.fields) setErrors(e.fields);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue building your portfolio."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={formError} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            className="mt-1.5"
            disabled={loading}
          />
          <FieldError message={errors.email} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            className="mt-1.5"
            disabled={loading}
          />
          <FieldError message={errors.password} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-2 text-xs uppercase tracking-wider text-muted-foreground">
              or
            </span>
          </div>
        </div>
        <Button type="button" variant="outline" className="w-full" disabled={loading}>
          <Github className="h-4 w-4" />
          Sign in with GitHub
        </Button>
      </form>
    </AuthCard>
  );
}
