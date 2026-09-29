import { useEffect, useState } from "react";
import {
  getPartners,
  trackPartnerClick,
  type Partner,
} from "../../services/community.service";

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    getPartners().then(setPartners);
  }, []);

  async function openPartner(partnerId: string) {
    const websiteUrl = await trackPartnerClick(partnerId);
    window.open(websiteUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="font-serif text-4xl">Partenaires</h1>

      {partners.length === 0 ? (
        <p className="mt-8 text-black/70">
          Les partenaires officiels seront publiés ici.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <article
              key={partner._id}
              className="rounded-2xl border border-black/10 bg-white p-6 text-center"
            >
              <img
                src={partner.logoUrl}
                alt={partner.name}
                className="mx-auto h-24 max-w-full object-contain"
              />

              <h2 className="mt-5 font-semibold">{partner.name}</h2>

              <p className="mt-2 text-sm text-black/60">
                {partner.category}
              </p>
               {partner.promoCode ? (
  <p className="mt-3 text-sm font-semibold text-gold">
    Code promo : {partner.promoCode}
  </p>
) : null}
              <button
                onClick={() => void openPartner(partner._id)}
                className="mt-5 rounded-full bg-gold px-5 py-3 font-semibold text-black"
              >
                Visiter
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}