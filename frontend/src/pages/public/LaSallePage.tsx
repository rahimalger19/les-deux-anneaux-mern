import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import {
  getVenueInfo,
  type VenueInfo,
} from "../../services/public-content.service";

export default function LaSallePage() {
  const { t } = useLanguage();
  const [venue, setVenue] = useState<VenueInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVenueInfo()
      .then(setVenue)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-4 w-32 rounded bg-foreground/10" />
          <div className="mt-4 h-12 max-w-xl rounded bg-foreground/10" />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="h-40 rounded-3xl bg-foreground/10" />
            <div className="h-40 rounded-3xl bg-foreground/10" />
          </div>
        </div>
      </main>
    );
  }

  if (!venue) {
    return (
      <main className="min-h-[70vh] bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-3xl rounded-3xl border border-foreground/15 bg-ivory p-8 text-center dark:bg-black sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
            {t("venue.eyebrow")}
          </p>

          <h1 className="mt-4 font-serif text-4xl">
            {t("venue.title")}
          </h1>

          <p className="mx-auto mt-6 max-w-xl leading-7 text-foreground/70">
            {t("venue.unavailable")}
          </p>

          <Link
            to="/contact"
            className="mt-8 inline-block rounded-full bg-gold px-6 py-3 font-semibold text-black"
          >
            {t("venue.contactUs")}
          </Link>
        </div>
      </main>
    );
  }

  const details = [
    {
      icon: "♀",
      label: t("venue.womenCapacity"),
      value: venue.womenCapacity,
    },
    {
      icon: "♂",
      label: t("venue.menCapacity"),
      value: venue.menCapacity,
    },
    {
      icon: "P",
      label: t("venue.parking"),
      value: venue.parking,
    },
    {
      icon: "◷",
      label: t("venue.openingHours"),
      value: venue.openingHours,
    },
  ];

  return (
    <main className="bg-background text-foreground">
      <section className="overflow-hidden bg-black px-6 py-16 text-ivory md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
              {t("venue.eyebrow")}
            </p>

            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
              {t("venue.heroTitle")}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-ivory/75">
              {t("venue.heroDescription")}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/reservation/creneau"
                className="rounded-full bg-gold px-6 py-3 font-semibold text-black transition hover:bg-gold/90"
              >
                {t("venue.book")}
              </Link>

              <Link
                to="/contact"
                className="rounded-full border border-ivory/40 px-6 py-3 font-semibold text-ivory transition hover:bg-white/10"
              >
                {t("venue.contactUs")}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-gold/30 bg-ivory/5 p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              {t("venue.atAGlance")}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {details.slice(0, 2).map((detail) => (
                <div
                  key={detail.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <span className="text-2xl text-gold">{detail.icon}</span>
                  <p className="mt-3 text-sm text-ivory/65">
                    {detail.label}
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {detail.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
            {t("venue.detailsEyebrow")}
          </p>

          <h2 className="mt-3 font-serif text-4xl">
            {t("venue.detailsTitle")}
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {details.map((detail) => (
            <article
              key={detail.label}
              className="rounded-2xl border border-foreground/15 bg-ivory p-6 dark:bg-black"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-lg font-bold text-gold">
                {detail.icon}
              </span>

              <p className="mt-5 text-sm text-foreground/65">
                {detail.label}
              </p>

              <p className="mt-1 text-lg font-semibold">{detail.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-foreground/[0.03] px-6 py-16 dark:bg-white/[0.03] md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
              {t("venue.spacesEyebrow")}
            </p>

            <h2 className="mt-3 font-serif text-4xl">
              {t("venue.spacesTitle")}
            </h2>

            <p className="mt-5 leading-7 text-foreground/70">
              {t("venue.spacesDescription")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {venue.spaces.map((space) => (
              <div
                key={space}
                className="flex items-center gap-4 rounded-2xl border border-foreground/15 bg-background p-5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-black">
                  ✓
                </span>

                <p className="font-semibold">{space}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
              {t("venue.virtualVisit")}
            </p>

            <h2 className="mt-3 font-serif text-4xl">
              {t("venue.virtualVisitTitle")}
            </h2>
          </div>

          <Link
            to="/contact"
            className="font-semibold text-gold underline underline-offset-4"
          >
            {t("venue.requestVisit")}
          </Link>
        </div>

        {venue.virtualVisitImages.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {venue.virtualVisitImages.map((image, index) => (
              <div
                key={image}
                className={`overflow-hidden rounded-3xl ${
                  index === 0 ? "md:col-span-2" : ""
                }`}
              >
                <img
                  src={image}
                  alt={`${t("venue.virtualVisit")} ${index + 1}`}
                  className={`w-full object-cover transition duration-500 hover:scale-105 ${
                    index === 0 ? "h-[28rem]" : "h-72"
                  }`}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-foreground/15 p-6 text-foreground/70">
            {t("venue.noImages")}
          </p>
        )}
      </section>

      <section className="bg-gold px-6 py-14 text-black">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-serif text-4xl">
              {t("venue.ctaTitle")}
            </h2>

            <p className="mt-3 text-black/75">{t("venue.ctaDescription")}</p>
          </div>

          <Link
            to="/reservation/creneau"
            className="rounded-full bg-black px-6 py-3 text-center font-semibold text-ivory"
          >
            {t("venue.book")}
          </Link>
        </div>
      </section>
    </main>
  );
}