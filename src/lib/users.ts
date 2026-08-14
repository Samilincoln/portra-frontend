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
  isAdmin?: boolean;
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

function toCamelCase(obj: Record<string, unknown>): UserProfile {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result as UserProfile;
}

export async function getMe(): Promise<UserProfile> {
  const raw = await apiFetch<unknown>("/api/v1/auth/me");
  if (!raw || typeof raw !== "object") return {} as UserProfile;
  return toCamelCase(raw as Record<string, unknown>);
}

export async function updateMe(
  input: Partial<UserProfile> & {
    currentPassword?: string;
    newPassword?: string;
  },
): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/v1/users/me", {
    method: "PATCH",
    body: toSnakeCasePayload(input as Record<string, unknown>),
  });
}

export async function deleteMe(): Promise<void> {
  await apiFetch("/api/v1/users/me", { method: "DELETE" });
}
