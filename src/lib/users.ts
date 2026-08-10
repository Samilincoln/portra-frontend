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
    body: input,
  });
}

export async function deleteMe(token: string | null): Promise<void> {
  await apiFetch("/api/v1/users/me", token, { method: "DELETE" });
}
