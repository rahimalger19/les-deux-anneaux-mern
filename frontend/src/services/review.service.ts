import { api } from "../api/client";

export type ReviewableBooking = {
  id: string;
  eventDate: string;
  eventTypeKey: string;
};

export type MyReview = {
  id: string;
  rating: number;
  message: string;
  photoUrls: string[];
  status: "PENDING" | "PUBLISHED" | "HIDDEN";
  likeCount: number;
  createdAt: string;
};

export async function getMyReviewableBookings() {
  const response = await api.get<{
    success: boolean;
    bookings: ReviewableBooking[];
  }>("/reviews/my/eligible-bookings");

  return response.data.bookings;
}

export async function getMyReviews() {
  const response = await api.get<{
    success: boolean;
    reviews: Array<MyReview & { _id?: string }>;
  }>("/reviews/my/list");

  return response.data.reviews.map((review) => ({
    ...review,
    id: review.id || review._id || "",
  }));
}

export async function createMyReview(data: FormData) {
  const response = await api.post("/reviews/my", data);
  return response.data as {
    success: boolean;
    message: string;
  };
}