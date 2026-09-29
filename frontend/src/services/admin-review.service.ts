import { api } from "../api/client";

export type AdminReview = {
  id: string;
  authorName: string;
  rating: number;
  message: string;
  photoUrls: string[];
  verified: boolean;
  status: "PENDING" | "PUBLISHED" | "HIDDEN";
  officialReply: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
};

export async function getAdminReviews(status?: string) {
  const response = await api.get<{
    success: boolean;
    reviews: AdminReview[];
  }>("/admin/reviews", {
    params: { status: status || undefined },
  });

  return response.data.reviews;
}

export async function updateAdminReview(
  reviewId: string,
  data: {
    status?: "PENDING" | "PUBLISHED" | "HIDDEN";
    officialReply?: string;
  }
) {
  const response = await api.patch(`/admin/reviews/${reviewId}`, data);
  return response.data;
}