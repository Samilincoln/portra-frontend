export const TIERS = {
  free: {
    id: "free",
    label: "Starter",
    price: "$0",
    profiles: 1,
    projects: 5,
    experiences: 5,
    skills: 10,
    testimonials: 5,
    blogPosts: 5,
    projectImages: 2,
    storage: "50 MB",
    customDomain: false,
    aiFeatures: false,
    analytics: false,
  },
  pro: {
    id: "pro",
    label: "Professional",
    price: "~$15/mo",
    profiles: 3,
    projects: Infinity,
    experiences: Infinity,
    skills: Infinity,
    testimonials: Infinity,
    blogPosts: Infinity,
    projectImages: Infinity,
    storage: "1 GB",
    customDomain: true,
    aiFeatures: true,
    analytics: true,
  },
  team: {
    id: "team",
    label: "Business",
    price: "~$39/mo",
    profiles: 10,
    projects: Infinity,
    experiences: Infinity,
    skills: Infinity,
    testimonials: Infinity,
    blogPosts: Infinity,
    projectImages: Infinity,
    storage: "10 GB",
    customDomain: true,
    aiFeatures: true,
    analytics: true,
  },
} as const;

export type TierId = keyof typeof TIERS;

export function getTier(id: string) {
  if (id === "pro") return TIERS.pro;
  if (id === "team") return TIERS.team;
  return TIERS.free;
}

export function getTierLimits(tier: TierId) {
  return TIERS[tier];
}

export function isAtLimit(
  tier: TierId,
  feature: keyof (typeof TIERS)["free"],
  current: number,
): boolean {
  const limit = TIERS[tier][feature];
  if (typeof limit !== "number") return false;
  return current >= limit;
}

export function getNextTier(tier: TierId): TierId | null {
  if (tier === "free") return "pro";
  if (tier === "pro") return "team";
  return null;
}

export function formatLimit(value: number): string {
  return value === Infinity ? "Unlimited" : String(value);
}
