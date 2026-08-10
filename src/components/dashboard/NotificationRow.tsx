import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/notifications";

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
};

const iconColorMap = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-amber-500",
};

export function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const navigate = useNavigate();
  const Icon = iconMap[notification.type] ?? Info;

  function handleClick() {
    onRead(notification.id);
    if (notification.link) {
      navigate({ to: notification.link });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
        !notification.read && "bg-muted/30",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          iconColorMap[notification.type],
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
      {!notification.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}
