import { apiFetch } from "@/lib/auth";

export type OAuthProvider = "github" | "linkedin" | "twitter";

export type OAuthUrlResponse = {
  url: string;
  code_verifier?: string;
};

export type LinkedAccount = {
  id: string;
  provider: OAuthProvider;
  created_at: string;
};

export type SocialLoginResponse = {
  access_token: string;
  refresh_token?: string;
};

export async function getOAuthUrl(
  token: string | null,
  provider: OAuthProvider,
): Promise<OAuthUrlResponse> {
  return apiFetch<OAuthUrlResponse>(
    `/api/v1/auth/${provider}/url`,
    token,
  );
}

export async function getLinkedAccounts(
  token: string | null,
): Promise<LinkedAccount[]> {
  return apiFetch<LinkedAccount[]>(
    "/api/v1/auth/oauth-accounts",
    token,
  );
}

export async function unlinkAccount(
  token: string | null,
  provider: OAuthProvider,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/v1/auth/${provider}/unlink`,
    token,
    { method: "DELETE" },
  );
}

export async function linkAccount(
  token: string | null,
  provider: OAuthProvider,
  code: string,
  codeVerifier?: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/v1/auth/${provider}/link`,
    token,
    {
      method: "POST",
      body: { code, code_verifier: codeVerifier },
    },
  );
}

export async function socialLogin(
  provider: OAuthProvider,
  code: string,
  codeVerifier?: string,
): Promise<SocialLoginResponse> {
  return apiFetch<SocialLoginResponse>(
    `/api/v1/auth/${provider}/login`,
    null,
    {
      method: "POST",
      body: { code, code_verifier: codeVerifier },
    },
  );
}
