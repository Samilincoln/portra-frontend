import { apiFetch } from "@/lib/auth";

export type Profile = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  bio?: string | null;
  headline?: string | null;
  avatar?: string | null;
  industries?: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProfileLimits = {
  tier: string;
  maxProfiles: number;
  currentCount: number;
};

export type ProfileInput = {
  name: string;
  slug: string;
  bio?: string;
  headline?: string;
  avatar?: string;
  industries?: string[];
};

export type SubscriptionTier = {
  tier: string;
  label: string;
  limits: Record<string, number>;
  features: Record<string, boolean>;
};

function normalizeProfile(raw: Record<string, unknown>): Profile {
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.user_id ?? raw.userId ?? ""),
    name: String(raw.name ?? ""),
    slug: String(raw.slug ?? ""),
    bio: (raw.bio as string) ?? null,
    headline: (raw.headline as string) ?? null,
    avatar: (raw.avatar as string) ?? null,
    industries: typeof raw.industries === "string"
      ? raw.industries.split(",").map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(raw.industries) ? (raw.industries as string[]) : [],
    isDefault: Boolean(raw.is_default ?? raw.isDefault),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? ""),
  };
}

function toSnakeCasePayload(input: Record<string, unknown>): Record<string, unknown> {
  const industries = input.industries;
  return {
    name: input.name,
    slug: input.slug,
    bio: input.bio,
    headline: input.headline,
    avatar: input.avatar,
    industries: Array.isArray(industries) ? industries.join(", ") : industries,
  };
}

export async function listProfiles(token: string | null): Promise<Profile[]> {
  const data = await apiFetch<Profile[] | { profiles: Profile[] }>(
    "/api/v1/profiles",
    token,
  );
  const items = Array.isArray(data) ? data : (data.profiles ?? []);
  return items.map(normalizeProfile);
}

export async function getProfileLimits(token: string | null): Promise<ProfileLimits> {
  return apiFetch<ProfileLimits>("/api/v1/profiles/limits", token);
}

export async function createProfile(
  token: string | null,
  input: ProfileInput,
): Promise<Profile> {
  const data = await apiFetch<Record<string, unknown>>("/api/v1/profiles", token, {
    method: "POST",
    body: toSnakeCasePayload(input),
  });
  return normalizeProfile(data);
}

export async function updateProfile(
  token: string | null,
  id: string,
  input: Partial<ProfileInput>,
): Promise<Profile> {
  const data = await apiFetch<Record<string, unknown>>(
    `/api/v1/profiles/${encodeURIComponent(id)}`,
    token,
    { method: "PATCH", body: toSnakeCasePayload(input) },
  );
  return normalizeProfile(data);
}

export async function deleteProfile(
  token: string | null,
  id: string,
): Promise<void> {
  await apiFetch(`/api/v1/profiles/${encodeURIComponent(id)}`, token, {
    method: "DELETE",
  });
}

export async function setDefaultProfile(
  token: string | null,
  id: string,
): Promise<Profile> {
  const data = await apiFetch<Record<string, unknown>>(
    `/api/v1/profiles/${encodeURIComponent(id)}/set-default`,
    token,
    { method: "POST" },
  );
  return normalizeProfile(data);
}

// --- Subscription / Tier ---

export async function getSubscriptionTier(token: string | null): Promise<SubscriptionTier> {
  return apiFetch<SubscriptionTier>("/api/v1/subscription/tier", token);
}

export async function getSubscriptionLimits(token: string | null): Promise<Record<string, number>> {
  return apiFetch<Record<string, number>>("/api/v1/subscription/limits", token);
}

export async function checkFeatureAccess(
  token: string | null,
  feature: string,
): Promise<{ allowed: boolean; tier: string }> {
  return apiFetch<{ allowed: boolean; tier: string }>(
    `/api/v1/subscription/features/${encodeURIComponent(feature)}`,
    token,
  );
}
