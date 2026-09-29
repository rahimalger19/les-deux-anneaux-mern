import { api } from "../api/client";

function getVisitorId() {
  const storageKey = "les-deux-anneaux-visitor-id";
  const existing = localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const visitorId = crypto.randomUUID();
  localStorage.setItem(storageKey, visitorId);

  return visitorId;
}

export function trackAnalyticsEvent(
  type:
    | "PAGE_VIEW"
    | "RESERVATION_ESTIMATE"
    | "BOOKING_DRAFT_CREATED"
    | "OTP_VERIFIED",
  path = window.location.pathname
) {
  const query = new URLSearchParams(window.location.search);

  return api.post("/analytics/events", {
    type,
    path,
    visitorId: getVisitorId(),
    device: navigator.userAgent,
    utmSource: query.get("utm_source") || undefined,
    utmMedium: query.get("utm_medium") || undefined,
    utmCampaign: query.get("utm_campaign") || undefined,
  });
}