import { API_BASE_URL, type AuthApiError } from "@/lib/auth";

export type Testimonial = {
  id: string;
  author: string;
  company?: string | null;
  role?: string | null;
  rating: number; // 1-5
  comment: string;
  avatarUrl?: string | null;
  createdAt?: string;
};

export type TestimonialInput = Omit<Testimonial, "id" | "createdAt">;

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function handle<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") ?? "";
  const data = ct.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};
  if (!res.ok) {
    throw {
      message:
        (data as { message?: string }).message ??
        `Request failed (${res.status})`,
      fields: (data as { fields?: Record<string, string> }).fields,
    } satisfies AuthApiError;
  }
  return data as T;
}

export async function listTestimonials(
  token: string | null,
): Promise<Testimonial[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/testimonials`, {
    headers: authHeaders(token),
  });
  const data = await handle<Testimonial[] | { testimonials: Testimonial[] }>(res);
  return Array.isArray(data) ? data : (data.testimonials ?? []);
}

export async function createTestimonial(
  token: string | null,
  input: TestimonialInput,
): Promise<Testimonial> {
  const res = await fetch(`${API_BASE_URL}/api/v1/testimonials`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return handle<Testimonial>(res);
}

export async function deleteTestimonial(
  token: string | null,
  id: string,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/testimonials/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) await handle(res);
}
