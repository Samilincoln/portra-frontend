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

export async function listNotifications(
  token: string | null,
): Promise<Notification[]> {
  const data = await apiFetch<
    Notification[] | { notifications: Notification[] }
  >("/api/v1/notifications", token);
  return Array.isArray(data) ? data : (data.notifications ?? []);
}

export async function markNotificationRead(
  token: string,
  id: string,
): Promise<void> {
  await apiFetch(`/api/v1/notifications/${id}/read`, token, { method: "PATCH" });
}

export async function markAllNotificationsRead(
  token: string,
): Promise<void> {
  await apiFetch("/api/v1/notifications/read-all", token, { method: "PATCH" });
}
