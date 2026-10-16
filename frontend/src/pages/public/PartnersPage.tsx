import { useEffect, useState } from "react";
import {
  getPartners,
  trackPartnerClick,
  type Partner,
} from "../../services/community.service";
import { useLanguage } from "../../hooks/useLanguage";

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
const { t } = useLanguage();
  useEffect(() => {
    getPartners().then(setPartners);
  }, []);

  
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

 
const categoryLabels: Record<Partner["category"], string> = {
  CATERER: t("partners.category.CATERER"),
  DECOR: t("partners.category.DECOR"),
  PHOTO: t("partners.category.PHOTO"),
  DJ: t("partners.category.DJ"),
  HOTEL: t("partners.category.HOTEL"),
};

  
return (
  <main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        Partenaires
      </p>

      <h1 className="mt-3 font-serif text-4xl text-foreground">
        {t("partners.title")}
      </h1>

      <div className="mt-5 h-px w-16 bg-gold" />

      {partners.length === 0 ? (
        <p className="mt-8 rounded-xl border border-foreground/10 bg-surface p-6 text-foreground/70">
          Les partenaires officiels seront publiés ici.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <article
              key={partner._id}
              className="group flex flex-col items-center rounded-2xl border border-foreground/10 bg-surface p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold/50"
            >
              <div className="flex h-28 w-full items-center justify-center rounded-xl border border-foreground/5 bg-white p-4">
                <img
                  src={partner.logoUrl}
                  alt={partner.name}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  className="mx-auto max-h-24 max-w-full object-contain"
                />
              </div>

              <h2 className="mt-5 font-serif text-xl font-semibold text-foreground">
                {partner.name}
              </h2>

              <p className="mt-2 text-sm text-foreground/65">
                {categoryLabels[partner.category]}
              </p>

              {partner.promoCode ? (
                <p className="mt-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold">
                  Code promo : {partner.promoCode}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void openPartner(partner)}
                className="mt-auto rounded-full bg-gold px-6 py-3 font-semibold text-black transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {t("partners.visit")}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  </main>
);

}