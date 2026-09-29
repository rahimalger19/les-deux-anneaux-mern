import { api } from "../api/client";

export type LocalizedText = {
  fr: string;
  ar: string;
  en: string;
};

export type PackDefinition = {
  name: LocalizedText;
  description: LocalizedText;
  basePriceDZD: number;
  extraGuestPriceDZD: number;
  includedGuests: number;
  diasporaBasePriceDZD?: number;
  diasporaExtraGuestPriceDZD?: number;
  includedItems: string[];
};

export type SuperPack = PackDefinition & {
  id: string;
  key: string;
  active: boolean;
};

export type CustomPackTemplate = PackDefinition & {
  id: string;
  active: boolean;
};

export type CatalogueService = {
  id: string;
  key: string;
  category: string;
  name: LocalizedText;
  priceDZD?: number;
};

export async function getSuperPacks() {
  const response = await api.get<{
    success: boolean;
    packs: SuperPack[];
    templates: CustomPackTemplate[];
    services: CatalogueService[];
  }>("/super/packs");

  return response.data;
}

export async function createSuperPack(
  data: PackDefinition & { key: string }
) {
  const response = await api.post("/super/packs", data);
  return response.data;
}

export async function updateSuperPack(
  key: string,
  data: PackDefinition
) {
  const response = await api.patch(`/super/packs/${key}`, data);
  return response.data;
}

export async function setSuperPackActive(
  key: string,
  active: boolean
) {
  const response = await api.patch(
    `/super/packs/${key}/status`,
    { active }
  );

  return response.data;
}

export async function createCustomPackTemplate(
  data: PackDefinition
) {
  const response = await api.post("/super/packs/templates", data);
  return response.data;
}

export async function updateCustomPackTemplate(
  templateId: string,
  data: PackDefinition
) {
  const response = await api.patch(
    `/super/packs/templates/${templateId}`,
    data
  );

  return response.data;
}

export async function setCustomPackTemplateActive(
  templateId: string,
  active: boolean
) {
  const response = await api.patch(
    `/super/packs/templates/${templateId}/status`,
    { active }
  );

  return response.data;
}