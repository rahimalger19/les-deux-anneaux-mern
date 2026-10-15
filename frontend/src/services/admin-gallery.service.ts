import { api } from "../api/client";

export type AdminGalleryItem = {
  id: string;
  album: string;
  eventTypeKey: string;
  title: {
    fr: string;
    ar: string;
    en: string;
  };
  imageUrl: string;
  likeCount: number;
  active: boolean;
  sortOrder: number;
  imageRightsConfirmed: boolean;
  createdAt: string;
};

export async function getAdminGalleryItems() {
  const response = await api.get<{
    success: boolean;
    items: AdminGalleryItem[];
  }>("/admin/gallery");

  return response.data.items;
}

export async function uploadAdminGalleryImages(data: FormData) {
  const response = await api.post("/admin/gallery", data);
  return response.data;
}

export async function updateAdminGalleryItem(
  itemId: string,
  data: {
    album?: string;
    eventTypeKey?: string;
    titleFr?: string;
    titleAr?: string;
    titleEn?: string;
    active?: boolean;
    sortOrder?: number;
    imageRightsConfirmed?: boolean;
  }
) {
  const response = await api.patch(`/admin/gallery/${itemId}`, data);
  return response.data;
}

export async function updateAdminGalleryOrder(
  items: Array<{
    id: string;
    sortOrder: number;
  }>
) {
  const response = await api.patch("/admin/gallery/order", { items });
  return response.data;
}

export async function hideAdminGalleryItem(itemId: string) {
  const response = await api.delete(`/admin/gallery/${itemId}`);
  return response.data;
}