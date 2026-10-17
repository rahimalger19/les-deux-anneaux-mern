import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { getEventTypes } from "../../services/catalog.service";
import type { EventType } from "../../types/catalog.types";
import BackButton from "../../components/common/BackButton";

export default function EventPage() {
  const { type } = useParams();
  const { language } = useLanguage();
  const [eventType, setEventType] = useState<EventType | null>(null);

  useEffect(() => {
    getEventTypes().then((items) => {
      setEventType(items.find((item) => item.key === type) || null);
    });
  }, [type]);

  const locale = language === "fr-DZ"
  ? "fr"
  : language === "ar-DZ"
    ? "ar"
    : "en";

  if (!eventType) {
    return <p className="p-10">Event type not found.</p>;
  }

  return (
    <section className="min-h-[60vh] bg-background px-6 py-16 text-foreground">
      <div className="fixed left-4 top-20 z-50 sm:left-6 sm:top-24">
        <BackButton fallback="/" label="Retour à l’accueil" />
      </div>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-5xl font-bold text-gold">
          {eventType.name[locale]}
        </h1>

{eventType.coverImage ? (
  <img
    src={eventType.coverImage}
    alt={eventType.name[locale]}
    className="mt-8 w-full rounded-2xl object-cover"
  />
) : null}

        <p className="mt-6 text-xl text-foreground/75">
          {eventType.description[locale]}
        </p>

        <div className="mt-8 grid gap-4 rounded-2xl border border-foreground/15 p-6 sm:grid-cols-3">
          <p>Duration: {eventType.durationHours}h</p>
          <p>Deposit: {eventType.depositPercent}%</p>
          <p>Slots: {eventType.allowedSlots.join(", ")}</p>
        </div>

        <Link
          to="/reservation"
          className="mt-8 inline-block rounded-full bg-gold px-6 py-3 font-semibold text-black"
        >
          Réserver maintenant
        </Link>
      </div>
    </section>
  );
}