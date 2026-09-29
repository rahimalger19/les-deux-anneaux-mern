import { api } from "../api/client";
import type { EventType, Pack } from "../types/catalog.types";

export async function getEventTypes() {
  const response = await api.get<{ success: boolean; eventTypes: EventType[] }>(
    "/catalog/event-types"
  );

  return response.data.eventTypes;
}

export async function getPacks() {
  const response = await api.get<{ success: boolean; packs: Pack[] }>(
    "/catalog/packs"
  );

  return response.data.packs;
}