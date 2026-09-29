import { api } from "../api/client";

export type LocalizedText = {
  fr: string;
  ar: string;
  en: string;
};

export type SystemLegalDocument = {
  id: string;
  key: string;
  title: LocalizedText;
  content: LocalizedText;
  published: boolean;
  updatedAt?: string;
};

export type BackupRecord = {
  id: string;
  fileName?: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  sizeBytes?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
};

export type SystemJob = {
  id: string;
  type: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  attempts: number;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: { name: string; email: string } | null;
};

export async function getSuperSystem() {
  const response = await api.get("/super/systeme");
  return response.data;
}

export async function createFeatureFlag(data: {
  key: string;
  description: string;
  enabled: boolean;
}) {
  return api.post("/super/systeme/flags", data);
}

export async function updateFeatureFlag(
  flagId: string,
  enabled: boolean
) {
  return api.patch(`/super/systeme/flags/${flagId}`, { enabled });
}

export async function updateLegalDocument(
  key: string,
  data: {
    title: LocalizedText;
    content: LocalizedText;
    published: boolean;
  }
) {
  return api.patch(`/super/systeme/legal/${key}`, data);
}

export async function createDatabaseBackup() {
  return api.post("/super/systeme/backups");
}