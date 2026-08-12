import { apiFetch } from "@/lib/auth";

export type UserProfile = {
  id?: string;
  name?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  avatar?: string | null;
  username?: string;
  customDomain?: string;
  theme?: string;
  social?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  subscriptionTier?: string;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function toSnakeCasePayload(input: Record<string, unknown>): Record<string, unknown> {
  return {
    name: input.name,
    email: input.email,
    bio: input.bio,
    avatar_url: input.avatarUrl,
    username: input.username,
    custom_domain: input.customDomain,
    theme: input.theme,
    social: input.social,
    current_password: input.currentPassword,
    new_password: input.newPassword,
  };
}

export async function getMe(token: string | null): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/v1/auth/me", token);
}

export async function updateMe(
  token: string | null,
  input: Partial<UserProfile> & {
    currentPassword?: string;
    newPassword?: string;
  },
): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/v1/users/me", token, {
    method: "PATCH",
    body: toSnakeCasePayload(input as Record<string, unknown>),
  });
}

export async function deleteMe(token: string | null): Promise<void> {
  await apiFetch("/api/v1/users/me", token, { method: "DELETE" });
}
