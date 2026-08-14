import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { linkAccount, socialLogin, type OAuthProvider } from "@/lib/oauth";

export const Route = createFileRoute("/auth/callback/$provider")({
  head: () => ({ meta: [{ title: "Connecting — Portra" }] }),
  component: OAuthCallbackPage,
});

const PROVIDERS: OAuthProvider[] = ["github", "linkedin", "twitter", "google"];

function OAuthCallbackPage() {
  const { provider } = Route.useParams();
  const { isAuthenticated, setSession } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!PROVIDERS.includes(provider as OAuthProvider)) {
      setStatus("error");
      setError("Invalid provider");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code) {
      setStatus("error");
      setError("No authorization code received");
      return;
    }

    // For Twitter, retrieve the code_verifier from sessionStorage
    let codeVerifier: string | undefined;
    if (provider === "twitter") {
      codeVerifier = sessionStorage.getItem("portra:twitter_code_verifier") ?? undefined;
      if (codeVerifier) {
        sessionStorage.removeItem("portra:twitter_code_verifier");
      }
    }

    // Branch based on auth state: logged in = link, not logged in = login
    if (isAuthenticated) {
      // Already logged in — link account
      linkAccount(provider as OAuthProvider, code, codeVerifier)
        .then(() => {
          setStatus("success");
          setTimeout(() => {
            window.close();
          }, 2000);
        })
        .catch((err: { message?: string }) => {
          setStatus("error");
          setError(err?.message ?? "Failed to connect account");
        });
    } else {
      // Not logged in — social login (backend sets cookies)
      socialLogin(provider as OAuthProvider, code, state ?? undefined)
        .then(() => {
          // Backend has set the auth cookies
          // Fetch user from cookie-authenticated endpoint
          import("@/lib/users").then(({ getMe }) =>
            getMe()
              .then((profile) => {
                setSession({
                  user: {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    username: profile.username,
                    subscriptionTier: profile.subscriptionTier,
                    isAdmin: profile.isAdmin,
                  },
                });
                setStatus("success");
                setTimeout(() => {
                  navigate({ to: "/dashboard" });
                }, 1500);
              })
              .catch(() => {
                // Cookie set but user fetch failed — redirect anyway
                setStatus("success");
                setTimeout(() => {
                  navigate({ to: "/dashboard" });
                }, 1500);
              }),
          );
        })
        .catch((err: { message?: string }) => {
          setStatus("error");
          setError(err?.message ?? "Failed to sign in");
        });
    }
  }, [provider, isAuthenticated, setSession, navigate]);

  const isLoginFlow = !isAuthenticated;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              {isLoginFlow ? `Signing in with ${provider}...` : `Connecting ${provider}...`}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we complete the process.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              {isLoginFlow ? `Signed in with ${provider}!` : `${provider} connected!`}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLoginFlow ? "Redirecting to dashboard..." : "This window will close automatically."}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              {isLoginFlow ? "Sign in failed" : "Connection failed"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {error ?? "Something went wrong. Please try again."}
            </p>
            <button
              onClick={() => window.close()}
              className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Close window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
