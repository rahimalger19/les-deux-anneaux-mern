import { api } from "../api/client";

export type ClientProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  profilePhotoUrl?: string;
};

export async function getMyProfile() {
  const response = await api.get<{
    success: boolean;
    user: ClientProfile;
  }>("/profile/me");

  return response.data.user;
}

export async function updateMyProfile(data: {
  name: string;
  email: string;
  phone: string;
  country: string;
  photo?: File | null;
}) {
  const formData = new FormData();

  formData.append("name", data.name);
  formData.append("email", data.email);
  formData.append("phone", data.phone);
  formData.append("country", data.country);

  if (data.photo) {
    formData.append("photo", data.photo);
  }

  const response = await api.patch("/profile/me", formData);
  return response.data;
}