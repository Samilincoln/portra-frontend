import { apiFetch } from "@/lib/auth";

export type NotificationType = "info" | "success" | "warning";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
};

export async function listNotifications(): Promise<Notification[]> {
  const data = await apiFetch<
    Notification[] | { notifications: Notification[] }
  >("/api/v1/notifications");
  return Array.isArray(data) ? data : (data.notifications ?? []);
}

export async function markNotificationRead(
  id: string,
): Promise<void> {
  await apiFetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/api/v1/notifications/read-all", { method: "PATCH" });
}
