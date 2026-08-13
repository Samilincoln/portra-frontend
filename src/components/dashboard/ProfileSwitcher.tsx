import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Settings, ArrowLeftRight } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/lib/auth";
import { getProfileLimits } from "@/lib/profiles";
import { getTier, type TierId } from "@/lib/plans";
import { useActiveProfile } from "@/lib/active-profile";

export function ProfileSwitcher() {
  const { token } = useAuth();
  const { activeProfile, profiles, isLoading, setActiveProfileId } = useActiveProfile();

  const limitsQuery = useQuery({
    queryKey: ["profile-limits"],
    queryFn: () => getProfileLimits(token),
  });

  const tierId = (limitsQuery.data?.tier as TierId) ?? "free";
  const tier = getTier(tierId);

  if (isLoading) {
    return (
      <div className="px-3">
        <div className="h-10 animate-pulse rounded-lg bg-sidebar-accent/50" />
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="px-3">
        <Link
          to="/dashboard/settings"
          search={{ tab: "profiles" }}
          className="flex items-center gap-2 rounded-lg border border-dashed border-sidebar-border px-3 py-2 text-xs text-sidebar-foreground/60 hover:border-sidebar-foreground/30"
        >
          <Settings className="h-3.5 w-3.5" />
          Create your first portfolio
        </Link>
      </div>
    );
  }

  return (
    <div className="px-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none ring-offset-sidebar transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-ring">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{activeProfile.name}</p>
            <p className="truncate text-[10px] text-sidebar-foreground/50">
              /{activeProfile.slug}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {tier.label}
          </Badge>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sidebar-foreground/70">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="start"
          className="w-56"
        >
          <DropdownMenuLabel>Switch portfolio</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {profiles.map((profile) => (
            <DropdownMenuItem
              key={profile.id}
              onClick={() => {
                if (profile.id !== activeProfile.id) {
                  setActiveProfileId(profile.id);
                }
              }}
              className="gap-2"
            >
              <Avatar className="h-6 w-6">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : null}
                <AvatarFallback className="text-[9px]">
                  {profile.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{profile.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  /{profile.slug}
                </p>
              </div>
              {profile.id === activeProfile.id ? (
                <Check className="h-3 w-3 shrink-0 text-accent" />
              ) : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              to="/dashboard/settings"
              search={{ tab: "profiles" }}
              className="gap-2"
            >
              <Settings className="h-3.5 w-3.5" />
              Manage portfolios
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
