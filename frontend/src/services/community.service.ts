import { api } from "../api/client";

export type LocalizedText = {
  fr: string;
  ar: string;
  en: string;
};

export type GalleryItem = {
  _id: string;
  album: string;
  eventTypeKey: string;
  title: LocalizedText;
  imageUrl: string;
  likeCount: number;
};

export type GalleryFavorite = {
  _id: string;
  collection: string;
  galleryItemId: GalleryItem;
};

export type MessageThread = {
  _id: string;
  subject: string;
  lastMessageAt: string;
  createdAt: string;
};

export type ClientMessage = {
  _id: string;
  senderType: "CLIENT" | "HALL";
  body: string;
  createdAt: string;
};

export type ClientNotification = {
  _id: string;
  title: string;
  body: string;
  link?: string;
  readAt?: string;
  createdAt: string;
};

function getGalleryVisitorId() {
  const storageKey = "les-deux-anneaux-gallery-visitor-id";
  const existing = localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const visitorId = crypto.randomUUID();
  localStorage.setItem(storageKey, visitorId);

  return visitorId;
}

export type GalleryAlbum = {
  album: string;
  eventTypeKey: string;
  imageCount: number;
  sortOrder: number;
};

export async function getGalleryAlbums(eventType?: string) {
  const response = await api.get<{
    success: boolean;
    albums: GalleryAlbum[];
  }>("/gallery/albums", {
    params: { eventType: eventType || undefined },
  });

  return response.data.albums;
}

export async function getGalleryItems(
  eventType?: string,
  album?: string
) {
  const response = await api.get<{
    success: boolean;
    items: GalleryItem[];
  }>("/gallery", {
    params: {
      eventType: eventType || undefined,
      album: album || undefined,
    },
  });

  return response.data.items;
}

export async function likeGalleryItem(itemId: string) {
  const response = await api.post<{
    success: boolean;
    liked: boolean;
    likeCount: number;
  }>(`/gallery/${itemId}/like`, {
    visitorId: getGalleryVisitorId(),
  });

  return response.data;
}


export async function getMyGalleryFavorites() {
  const response = await api.get<{
    success: boolean;
    favorites: GalleryFavorite[];
  }>("/gallery-favorites");

  return response.data.favorites;
}

export async function addMyGalleryFavorite(
  itemId: string,
  collection = "Inspiration"
) {
  const response = await api.post(`/gallery-favorites/${itemId}`, {
    collection,
  });

  return response.data;
}

export async function removeMyGalleryFavorite(favoriteId: string) {
  const response = await api.delete(`/gallery-favorites/${favoriteId}`);
  return response.data;
}

export async function getMyThreads() {
  const response = await api.get<{
    success: boolean;
    threads: MessageThread[];
  }>("/messages/threads");

  return response.data.threads;
}

export async function createMyThread(subject: string, body: string) {
  const response = await api.post("/messages/threads", { subject, body });
  return response.data;
}

export async function getMyThreadMessages(threadId: string) {
  const response = await api.get<{
    success: boolean;
    thread: MessageThread;
    messages: ClientMessage[];
  }>(`/messages/threads/${threadId}`);

  return response.data;
}

export async function sendMyThreadMessage(threadId: string, body: string) {
  const response = await api.post(
    `/messages/threads/${threadId}/messages`,
    { body }
  );

  return response.data;
}

export async function getMyNotifications() {
  const response = await api.get<{
    success: boolean;
    notifications: ClientNotification[];
  }>("/messages/notifications");

  return response.data.notifications;
}

export async function markMyNotificationRead(notificationId: string) {
  const response = await api.patch(
    `/messages/notifications/${notificationId}/read`
  );

  return response.data;
}

export type Partner = {
  promoCode?: string;
  [key: string]: any;
};

export type Review = {
  _id: string;
  bookingId: string;
  authorName: string;
  rating: number;
  message: string;
  photoUrls: string[];
  verified: boolean;
  status: "PENDING" | "PUBLISHED" | "HIDDEN";
  officialReply?: string;
  likeCount: number;
  createdAt: string;
};

export async function getPartners() {
  const response = await api.get("/partners");
  return response.data.partners as Partner[];
}

export async function trackPartnerClick(partnerId: string) {
  const response = await api.post(`/partners/${partnerId}/click`);
  return response.data;
}

export async function getPublishedReviews() {
  const response = await api.get("/reviews");
  return response.data.reviews as Review[];
}

function getReviewVisitorId() {
  const storageKey = "les-deux-anneaux-review-visitor-id";
  const existing = localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const visitorId = crypto.randomUUID();
  localStorage.setItem(storageKey, visitorId);

  return visitorId;
}

export async function likeReview(reviewId: string) {
  const response = await api.post<{
    success: boolean;
    liked: boolean;
    likeCount: number;
  }>(`/reviews/${reviewId}/like`, {
    visitorId: getReviewVisitorId(),
  });

  return response.data;
}

export type ReviewableBooking = {
  id: string;
  eventDate: string;
  eventTypeKey: string;
};

export async function getMyReviews() {
  const response = await api.get<{
    success: boolean;
    reviews: Review[];
  }>("/reviews/my/list");

  return response.data.reviews;
}

export async function getMyReviewableBookings() {
  const response = await api.get<{
    success: boolean;
    bookings: ReviewableBooking[];
  }>("/reviews/my/eligible-bookings");

  return response.data.bookings;
}

export async function createMyReview(data: {
  bookingId: string;
  rating: number;
  message: string;
  photos: File[];
}) {
  const formData = new FormData();

  formData.append("bookingId", data.bookingId);
  formData.append("rating", String(data.rating));
  formData.append("message", data.message);

  data.photos.forEach((photo) => {
    formData.append("photos", photo);
  });

  const response = await api.post("/reviews/my", formData);
  return response.data;
}