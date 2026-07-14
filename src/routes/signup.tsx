import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { AuthCard, FieldError, FormError } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authFetch, useAuth, type AuthUser } from "@/lib/auth";

const schema = z
  .object({
    name: z.string().trim().min(2, { message: "Name is too short" }).max(100),
    email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
    password: z.string().min(8, { message: "At least 8 characters" }).max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Portra" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
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
      const { confirm: _c, ...payload } = parsed.data;
      void _c;
      const data = await authFetch<{ token: string; user?: AuthUser }>(
        "/api/v1/auth/signup",
        payload,
      );
      setSession({
        token: data.token,
        user: data.user ?? { name: payload.name, email: payload.email },
      });
      await router.invalidate();
      navigate({ to: "/dashboard" });
    } catch (err) {
      const e = err as { message?: string; fields?: Record<string, string> };
      setFormError(e.message ?? "Unable to create account");
      if (e.fields) setErrors(e.fields);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your Portra"
      subtitle="Start building your engineering portfolio in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={formError} />
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="mt-1.5"
            disabled={loading}
            autoComplete="name"
          />
          <FieldError message={errors.name} />
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            className="mt-1.5"
            disabled={loading}
          />
          <FieldError message={errors.password} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={values.confirm}
            onChange={(e) => setValues((v) => ({ ...v, confirm: e.target.value }))}
            className="mt-1.5"
            disabled={loading}
          />
          <FieldError message={errors.confirm} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
