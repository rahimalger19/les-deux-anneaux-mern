import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackAnalyticsEvent } from "../../services/analytics.service";

export default function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    void trackAnalyticsEvent(
      "PAGE_VIEW",
      `${location.pathname}${location.search}`
    );
  }, [location.pathname, location.search]);

  return null;
}