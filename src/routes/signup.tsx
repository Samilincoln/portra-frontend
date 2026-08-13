import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Github, Linkedin, Loader2 } from "lucide-react";
import { AuthCard, FieldError, FormError } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authFetch, useAuth, type AuthUser, type AuthApiError } from "@/lib/auth";
import { getMe } from "@/lib/users";
import { getOAuthUrl, type OAuthProvider } from "@/lib/oauth";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

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

  async function connectProvider(provider: OAuthProvider) {
    try {
      const { url, code_verifier } = await getOAuthUrl(null, provider);

      // Store code_verifier for Twitter PKCE flow
      if (code_verifier) {
        localStorage.setItem("portra:twitter_code_verifier", code_verifier);
      }

      // Open popup
      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      window.open(
        url,
        `Connect ${provider}`,
        `width=${width},height=${height},left=${left},top=${top}`,
      );
    } catch (err: { message?: string }) {
      setFormError(err?.message ?? "Failed to start social login");
    }
  }

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
      const data = await authFetch<{ token?: string; access_token?: string; accessToken?: string; user?: AuthUser }>(
        "/api/v1/auth/signup",
        payload,
      );
      console.log("Signup response:", data);
      const token = data.token ?? data.access_token ?? data.accessToken;
      if (!token) {
        throw { message: "Invalid response: token not found in response" } satisfies AuthApiError;
      }
      const initialUser = data.user ?? { name: payload.name, email: payload.email };
      setSession({
        token,
        user: initialUser,
      });
      // Fetch full profile to ensure name is populated
      if (!initialUser?.name) {
        try {
          const profile = await getMe(token);
          if (profile?.name) {
            setSession({ token, user: { ...initialUser, name: profile.name, username: profile.username } });
          }
        } catch {
          // Profile fetch failed, continue with initial user
        }
      }
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
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={() => connectProvider("github")}
        >
          <Github className="h-4 w-4" />
          Sign up with GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={() => connectProvider("linkedin")}
        >
          <Linkedin className="h-4 w-4" />
          Sign up with LinkedIn
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={() => connectProvider("twitter")}
        >
          <GoogleIcon className="h-4 w-4" />
          Sign up with Google
        </Button>
      </form>
    </AuthCard>
  );
}
