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
  <main className="bg-background text-foreground">
    <section className="bg-espresso px-6 py-20 text-ivory">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <img
            src="/images/logo-white-mode.jpg"
            alt={t("brand.name")}
            className="h-24 w-auto"
          />

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-gold">
            {t("home.venue")}
          </p>

          <h1 className="mt-4 font-serif text-5xl leading-tight md:text-6xl">
            {t("home.mainTitle")}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-ivory/80">
            {t("home.mainDescription")}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/reservation"
              className="rounded-full bg-gold px-6 py-3 font-semibold text-black transition hover:bg-gold/90"
            >
              {t("nav.book")}
            </Link>

            <Link
              to="/contact"
              className="rounded-full border border-ivory/40 px-6 py-3 font-semibold text-ivory transition hover:border-gold hover:text-gold"
            >
              {t("home.requestAppointment")}
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-gold/30 bg-black p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-gold">
            {t("home.availability")}
          </p>

          <p className="mt-4 font-serif text-3xl text-ivory">
            {t("home.slots")}
          </p>

          <p className="mt-4 text-ivory/80">
            {t("home.slotsDescription")}
          </p>

          <Link
            to="/packs-tarifs"
            className="mt-7 inline-block font-semibold text-gold underline underline-offset-4 transition hover:text-ivory"
          >
            {t("home.viewPricing")}
          </Link>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
        {t("home.events")}
      </p>

      <h2 className="mt-3 font-serif text-4xl text-foreground">
        {t("home.eventsTitle")}
      </h2>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {eventTypes.map((eventType) => (
          <Link
            key={eventType.key}
            to={`/evenements/${eventType.key}`}
            className="rounded-2xl border border-foreground/15 bg-surface p-6 text-foreground transition hover:border-gold hover:shadow-lg hover:shadow-black/5"
          >
            <h3 className="font-serif text-2xl text-gold">
              {eventType.name[locale]}
            </h3>

            <p className="mt-3 text-sm leading-6 text-foreground/75">
              {eventType.description[locale]}
            </p>
          </Link>
        ))}
      </div>
    </section>

    <section className="bg-espresso px-6 py-16 text-ivory">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
              {t("home.gallery")}
            </p>

            <h2 className="mt-3 font-serif text-4xl text-ivory">
              {t("home.galleryTitle")}
            </h2>
          </div>

          <Link
            to="/galerie"
            className="font-medium text-gold underline underline-offset-4 transition hover:text-ivory"
          >
            {t("home.viewGallery")}
          </Link>
        </div>

        {galleryItems.length === 0 ? (
          <p className="mt-8 text-ivory/75">
            {t("home.galleryEmpty")}
          </p>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {galleryItems.map((item) => (
              <img
                key={item._id}
                src={item.imageUrl}
                alt={item.title[locale]}
                className="h-72 w-full rounded-2xl object-cover transition duration-300 hover:scale-[1.02]"
              />
            ))}
          </div>
        )}
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
            {t("home.reviews")}
          </p>

          <h2 className="mt-3 font-serif text-4xl text-foreground">
            {t("home.reviewsTitle")}
          </h2>
        </div>

        {averageRating ? (
          <p className="text-2xl font-semibold text-gold">
            ★ {averageRating} / 5
          </p>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-8 text-foreground/70">
          {t("home.reviewsEmpty")}
        </p>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review._id}
              className="rounded-2xl border border-foreground/15 bg-surface p-6 text-foreground transition hover:border-gold"
            >
              <p className="text-gold">{"★".repeat(review.rating)}</p>

              <p className="mt-4 leading-7 text-foreground/75">
                {review.message}
              </p>

              <p className="mt-5 font-semibold text-foreground">
                {review.authorName}
              </p>
            </article>
          ))}
        </div>
      )}

      <Link
        to="/avis"
        className="mt-8 inline-block rounded-full border border-foreground/25 px-5 py-3 font-semibold text-foreground transition hover:border-gold hover:text-gold"
      >
        {t("home.viewReviews")}
      </Link>
    </section>

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
                className="h-24 w-full rounded-xl border border-foreground/15 bg-background p-4 transition hover:border-gold hover:shadow-md"
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

    <section className="bg-gold px-6 py-16 text-black">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="font-serif text-4xl">
            {t("home.newsletterTitle")}
          </h2>

          <p className="mt-3 leading-7 text-black/80">
            {t("home.newsletterDescription")}
          </p>
        </div>

        <Link
          to="/newsletter"
          className="rounded-full bg-black px-6 py-3 text-center font-semibold text-ivory transition hover:bg-espresso"
        >
          {t("footer.newsletter")}
        </Link>
      </div>
    </section>
  </main>
);
}
