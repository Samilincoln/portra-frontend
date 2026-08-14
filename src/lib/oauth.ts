import { apiFetch } from "@/lib/auth";

export type OAuthProvider = "github" | "linkedin" | "twitter" | "google";

export type OAuthUrlResponse = {
  url: string;
  state?: string;
  code_verifier?: string;
};

export type LinkedAccount = {
  id: string;
  provider: OAuthProvider;
  created_at: string;
};

export async function getOAuthUrl(
  provider: OAuthProvider,
): Promise<OAuthUrlResponse> {
  return apiFetch<OAuthUrlResponse>(
    `/api/v1/auth/${provider}/url`,
  );
}

export async function getLinkedAccounts(): Promise<LinkedAccount[]> {
  return apiFetch<LinkedAccount[]>(
    "/api/v1/auth/oauth-accounts",
  );
}

export async function unlinkAccount(
  provider: OAuthProvider,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/v1/auth/${provider}/unlink`,
    { method: "DELETE" },
  );
}

export async function linkAccount(
  provider: OAuthProvider,
  code: string,
  codeVerifier?: string,
): Promise<{ message: string }> {
  const body: Record<string, string> = { code };
  if (codeVerifier) body.code_verifier = codeVerifier;
  return apiFetch<{ message: string }>(
    `/api/v1/auth/${provider}/link`,
    { method: "POST", body },
  );
}

export async function socialLogin(
  provider: OAuthProvider,
  code: string,
  state?: string,
): Promise<{ access_token: string }> {
  const body: Record<string, string> = { code };
  if (state) body.state = state;
  return apiFetch<{ access_token: string }>(
    `/api/v1/auth/${provider}/login`,
    { method: "POST", body },
  );
}
