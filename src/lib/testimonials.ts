import { apiFetch } from "@/lib/auth";

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

export async function listTestimonials(
  token: string | null,
  profileId?: string,
): Promise<Testimonial[]> {
  const params = new URLSearchParams();
  if (profileId) params.set("profile_id", profileId);
  const qs = params.toString();
  const data = await apiFetch<Testimonial[] | { testimonials: Testimonial[] }>(
    `/api/v1/testimonials${qs ? `?${qs}` : ""}`,
    token,
  );
  return Array.isArray(data) ? data : (data.testimonials ?? []);
}

export async function createTestimonial(
  token: string | null,
  input: TestimonialInput,
  profileId?: string,
): Promise<Testimonial> {
  const params = new URLSearchParams();
  if (profileId) params.set("profile_id", profileId);
  const qs = params.toString();
  return apiFetch<Testimonial>(
    `/api/v1/testimonials${qs ? `?${qs}` : ""}`,
    token,
    { method: "POST", body: input },
  );
}

export async function deleteTestimonial(
  token: string | null,
  id: string,
): Promise<void> {
  await apiFetch(`/api/v1/testimonials/${id}`, token, { method: "DELETE" });
}
