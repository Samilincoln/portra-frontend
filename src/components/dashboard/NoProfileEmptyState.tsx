import { Link } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NoProfileEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-accent">
        <UserPlus className="h-6 w-6" />
      </div>
      <div className="max-w-sm">
        <p className="text-lg font-semibold">Create your first profile</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You need a profile before you can add projects, experience, skills, and more.
        </p>
      </div>
      <Button asChild className="mt-2 gap-1.5">
        <Link to="/dashboard/settings">
          <UserPlus className="h-4 w-4" />
          Create profile
        </Link>
      </Button>
    </div>
  );
}
