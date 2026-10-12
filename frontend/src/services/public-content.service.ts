const API_URL = import.meta.env.VITE_API_URL;

export type LocalizedText = {
  fr: string;
  ar: string;
  en: string;
};

export type PublicService = {
  _id: string;
  key?: string;
  category: "VENUE" | "SALON" | "STAGE" | "SOUND" | "STAFF" | "OPTION";
  name: LocalizedText;
  description: LocalizedText;
  priceDZD?: number;
  image?: string;
};

export type VenueInfo = {
  _id: string;
  womenCapacity?: number;
  menCapacity?: number;
  spaces: string[];
  parking?: string;
  openingHours?: string;
  virtualVisitImages: string[];
};

export type Faq = {
  _id: string;
  key: string;
  question: LocalizedText;
  answer: LocalizedText;
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load content");
  }

  return data;
}

export async function getPublicServices() {
  
  const data = await getJson<{ services: PublicService[] }>("/public/services");
  return data.services;
}

export async function getVenueInfo() {
  const data = await getJson<{ venue: VenueInfo | null }>("/public/venue");
  return data.venue;
}

export async function getPublicFaqs() {
  
  const data = await getJson<{ faqs: Faq[] }>("/public/faq");
  return data.faqs;
}