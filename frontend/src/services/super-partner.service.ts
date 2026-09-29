import { api } from "../api/client";

export type PartnerCategory =
  | "CATERER"
  | "DECOR"
  | "PHOTO"
  | "DJ"
  | "HOTEL";

export type SuperPartner = {
  id: string;
  name: string;
  category: PartnerCategory;
  logoUrl: string;
  websiteUrl: string;
  promoCode?: string;
  displayOrder: number;
  clickCount: number;
  active: boolean;
};

export type PartnerInput = {
  name: string;
  category: PartnerCategory;
  logoUrl: string;
  websiteUrl: string;
  promoCode?: string;
  displayOrder: number;
};

export async function getSuperPartners() {
  const response = await api.get<{
    success: boolean;
    partners: SuperPartner[];
  }>("/super/partenaires");

  return response.data.partners;
}

export async function createSuperPartner(data: PartnerInput) {
  const response = await api.post("/super/partenaires", data);
  return response.data;
}

export async function updateSuperPartner(
  partnerId: string,
  data: PartnerInput
) {
  const response = await api.patch(
    `/super/partenaires/${partnerId}`,
    data
  );

  return response.data;
}

export async function setSuperPartnerActive(
  partnerId: string,
  active: boolean
) {
  const response = await api.patch(
    `/super/partenaires/${partnerId}/status`,
    { active }
  );

  return response.data;
}

export async function reorderSuperPartners(partnerIds: string[]) {
  const response = await api.patch(
    "/super/partenaires/reorder",
    { partnerIds }
  );

  return response.data;
}