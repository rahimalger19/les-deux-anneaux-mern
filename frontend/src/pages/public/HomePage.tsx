import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { getEventTypes } from "../../services/catalog.service";
import {
  getGalleryItems,
  getPartners,
  trackPartnerClick,
  getPublishedReviews,
  type GalleryItem,
  type Partner,
  type Review,
} from "../../services/community.service";
import type { EventType } from "../../types/catalog.types";

export default function HomePage() {
  const { language, t } = useLanguage();

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  const locale =
    language === "fr-DZ" ? "fr" : language === "ar-DZ" ? "ar" : "en";

  useEffect(() => {
    Promise.all([
      getEventTypes(),
      getGalleryItems(),
      getPublishedReviews(),
      getPartners(),
    ]).then(([eventTypesData, galleryData, reviewsData, partnersData]) => {
      setEventTypes(eventTypesData);
      setGalleryItems(galleryData.slice(0, 3));
      setReviews(reviewsData.slice(0, 3));
      setPartners(partnersData.slice(0, 5));
    });
  }, []);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return null;
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);

    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  function openPartner(partner: Partner) {
  try {
    const url = new URL(partner.websiteUrl);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Invalid partner URL");
    }

    window.open(url.href, "_blank", "noopener,noreferrer");

    void trackPartnerClick(partner._id).catch(() => {
      console.error("Partner click could not be recorded.");
    });
  } catch {
    console.error("Impossible d’ouvrir le site du partenaire.");
  }
}

return (
  <main className="overflow-hidden bg-background text-foreground">
    {/* Hero */}
    <section className="relative overflow-hidden bg-espresso px-6 py-20 text-ivory sm:py-28 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-20 h-96 w-96 rounded-full border border-gold/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-4 h-64 w-64 rounded-full border border-gold/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
        <div>
          <img
            src="/images/logo-white-mode.jpg"
            alt={t("brand.name")}
            className="h-20 w-auto object-contain sm:h-24"
          />

          <p className="mt-9 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">
            <span className="h-px w-9 bg-gold" />
            {t("home.venue")}
          </p>

          <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {t("home.mainTitle")}
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-ivory/75 sm:text-lg">
            {t("home.mainDescription")}
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              to="/reservation"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-black shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:bg-gold/90 focus:outline-none focus:ring-4 focus:ring-gold/30"
            >
              {t("nav.book")}
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full border border-ivory/25 px-7 py-3.5 text-sm font-semibold text-ivory transition duration-300 hover:border-gold hover:bg-gold/5 hover:text-gold focus:outline-none focus:ring-4 focus:ring-gold/20"
            >
              {t("home.requestAppointment")}
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-3 text-xs text-ivory/50 sm:text-sm">
            <span className="h-px w-8 bg-gold/60" />
            {t("home.availability")}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-[2rem] border border-gold/20"
          />

          <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-black/30 p-7 backdrop-blur-sm sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold sm:text-sm">
                {t("home.availability")}
              </p>
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-gold shadow-[0_0_12px_rgba(198,161,91,0.7)]"
              />
            </div>

            <div className="my-7 h-px bg-gradient-to-r from-gold/60 via-gold/20 to-transparent" />

            <p className="font-serif text-3xl leading-snug text-ivory sm:text-4xl">
              {t("home.slots")}
            </p>

            <p className="mt-5 text-sm leading-7 text-ivory/65 sm:text-base">
              {t("home.slotsDescription")}
            </p>

            <Link
              to="/packs-tarifs"
              className="mt-8 inline-flex items-center gap-3 font-semibold text-gold transition hover:gap-4 hover:text-ivory"
            >
              {t("home.viewPricing")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* Events */}
    <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
      <div className="max-w-2xl">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">
          <span className="h-px w-8 bg-gold" />
          {t("home.events")}
        </p>

        <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl md:text-5xl">
          {t("home.eventsTitle")}
        </h2>
      </div>

      <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {eventTypes.map((eventType, index) => (
          <Link
            key={eventType.key}
            to={`/evenements/${eventType.key}`}
            className="group relative overflow-hidden rounded-2xl border border-foreground/10 bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-xl hover:shadow-black/5 sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-serif text-sm text-gold/80">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 text-foreground/50 transition group-hover:border-gold/50 group-hover:text-gold"
              >
                ↗
              </span>
            </div>

            <h3 className="mt-8 font-serif text-2xl leading-snug text-foreground transition group-hover:text-gold sm:text-3xl">
              {eventType.name[locale]}
            </h3>

            <p className="mt-4 text-sm leading-7 text-foreground/65">
              {eventType.description[locale]}
            </p>

            <div className="mt-7 h-px w-10 bg-gold/60 transition-all duration-300 group-hover:w-20" />
          </Link>
        ))}
      </div>
    </section>

    {/* Gallery */}
    <section className="bg-espresso px-6 py-20 text-ivory sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">
              <span className="h-px w-8 bg-gold" />
              {t("home.gallery")}
            </p>

            <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl md:text-5xl">
              {t("home.galleryTitle")}
            </h2>
          </div>

          <Link
            to="/galerie"
            className="inline-flex items-center gap-3 self-start text-sm font-semibold text-gold transition hover:gap-4 hover:text-ivory sm:self-auto"
          >
            {t("home.viewGallery")}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {galleryItems.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-ivory/10 bg-black/15 px-6 py-8 text-sm leading-7 text-ivory/65">
            {t("home.galleryEmpty")}
          </p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item, index) => (
              <div
                key={item._id}
                className={`group relative overflow-hidden rounded-2xl bg-black ${
                  index === 0 ? "sm:row-span-2" : ""
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title[locale]}
                  loading="lazy"
                  className={`w-full object-cover transition duration-700 group-hover:scale-105 ${
                    index === 0 ? "h-full min-h-72 sm:min-h-[36rem]" : "h-72"
                  }`}
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-60 transition group-hover:opacity-100" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>

    {/* Reviews */}
    <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">
            <span className="h-px w-8 bg-gold" />
            {t("home.reviews")}
          </p>

          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl md:text-5xl">
            {t("home.reviewsTitle")}
          </h2>
        </div>

        {averageRating ? (
          <div className="flex items-center gap-3 self-start rounded-2xl border border-gold/25 bg-gold/5 px-5 py-3 sm:self-auto">
            <span className="text-2xl text-gold">★</span>
            <p className="text-xl font-bold text-foreground">
              {averageRating}
              <span className="ml-1 text-sm font-normal text-foreground/50">
                / 5
              </span>
            </p>
          </div>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-foreground/10 bg-surface px-6 py-8 text-sm leading-7 text-foreground/65">
          {t("home.reviewsEmpty")}
        </p>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review._id}
              className="group flex flex-col rounded-2xl border border-foreground/10 bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl hover:shadow-black/5 sm:p-7"
            >
              <div
                className="text-lg tracking-[0.15em] text-gold"
                aria-label={`${review.rating} sur 5 étoiles`}
              >
                {"★".repeat(review.rating)}
                <span className="text-foreground/15">
                  {"★".repeat(Math.max(0, 5 - review.rating))}
                </span>
              </div>

              <div className="my-5 h-px w-10 bg-gold/40 transition-all group-hover:w-16" />

              <p className="flex-1 text-sm leading-7 text-foreground/75">
                {review.message}
              </p>

              <div className="mt-6 border-t border-foreground/10 pt-5">
                <p className="font-semibold text-foreground">
                  {review.authorName}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <Link
        to="/avis"
        className="mt-9 inline-flex items-center gap-3 rounded-full border border-foreground/15 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold focus:outline-none focus:ring-4 focus:ring-gold/15"
      >
        {t("home.viewReviews")}
        <span aria-hidden="true">→</span>
      </Link>
    </section>

    {/* Partners — intentionally unchanged */}
    <section className="bg-surface px-6 py-16 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
          {t("home.partners")}
        </p>

        <h2 className="mt-3 font-serif text-4xl text-foreground">
          {t("home.partnersTitle")}
        </h2>

        {partners.length === 0 ? (
          <p className="mt-8 text-foreground/70">
            {t("home.partnersEmpty")}
          </p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {partners.map((partner) => (
              <button
                key={partner._id}
                type="button"
                onClick={() => void openPartner(partner)}
                aria-label={`Visiter le site de ${partner.name}`}
                className="h-24 w-full rounded-xl border border-foreground/15 bg-white p-4 transition hover:border-gold hover:shadow-md"
              >
                <img
                  src={partner.logoUrl}
                  alt={partner.name}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  className="h-full w-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>

    {/* Newsletter */}
    <section className="relative overflow-hidden bg-gold px-6 py-16 text-black sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-black/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-black/10"
      />

      <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-black/60">
            Les Deux Anneaux
          </p>

          <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl md:text-5xl">
            {t("home.newsletterTitle")}
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-black/75 sm:text-base">
            {t("home.newsletterDescription")}
          </p>
        </div>

        <Link
          to="/newsletter"
          className="inline-flex shrink-0 items-center justify-center gap-3 self-start rounded-full bg-black px-7 py-3.5 text-sm font-bold text-ivory transition duration-300 hover:-translate-y-1 hover:bg-espresso focus:outline-none focus:ring-4 focus:ring-black/20 md:self-auto"
        >
          {t("footer.newsletter")}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  </main>
);
}
