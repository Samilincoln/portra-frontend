import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { listProfiles, type Profile } from "@/lib/profiles";

type ActiveProfileContextValue = {
  activeProfile: Profile | null;
  profiles: Profile[];
  isLoading: boolean;
  setActiveProfileId: (id: string) => void;
};

const ActiveProfileContext = createContext<ActiveProfileContextValue | null>(null);

const STORAGE_KEY = "portra:activeProfileId";

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  useAuth();
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    queryFn: () => listProfiles(),
  });

  const profiles = profilesQuery.data ?? [];

  // Auto-select default profile if none selected or selected profile not in list
  useEffect(() => {
    if (profiles.length === 0) return;
    const exists = profiles.some((p) => p.id === activeProfileId);
    if (!exists) {
      const defaultProfile = profiles.find((p) => p.isDefault) ?? profiles[0];
      if (defaultProfile) {
        setActiveProfileIdState(defaultProfile.id);
        try {
          localStorage.setItem(STORAGE_KEY, defaultProfile.id);
        } catch { /* ignore */ }
      }
    }
  }, [profiles, activeProfileId]);

  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch { /* ignore */ }
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const value = useMemo(
    () => ({
      activeProfile,
      profiles,
      isLoading: profilesQuery.isLoading,
      setActiveProfileId,
    }),
    [activeProfile, profiles, profilesQuery.isLoading, setActiveProfileId],
  );

  return (
    <ActiveProfileContext.Provider value={value}>
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile() {
  const ctx = useContext(ActiveProfileContext);
  if (!ctx) throw new Error("useActiveProfile must be used inside ActiveProfileProvider");
  return ctx;
}
