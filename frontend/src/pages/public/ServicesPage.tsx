import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useLanguage } from "../../hooks/useLanguage";
import { useCurrency } from "../../hooks/useCurrency";
import {
  getPublicServices,
  type PublicService,
} from "../../services/public-content.service";



export default function ServicesPage() {
  const { language } = useLanguage();
  const location = useLocation();
  const { formatPrice } = useCurrency();

const navigationState = location.state as { returnTo?: string } | null;

const returnTo =
  navigationState?.returnTo === "/reservation/details"
    ? "/reservation/details"
    : "/reservation/creneau";
  const {
    optionKeys: selectedServiceKeys,
    setOptionKeys,
  } = useCart();

  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);

  const locale =
    language === "fr-DZ" ? "fr" : language === "ar-DZ" ? "ar" : "en";

  useEffect(() => {
    getPublicServices()
      .then(setServices)
      .finally(() => setLoading(false));
  }, []);

  function toggleService(serviceKey: string) {
    setOptionKeys((current) =>
      current.includes(serviceKey)
        ? current.filter((key) => key !== serviceKey)
        : [...current, serviceKey]
    );
  }

  if (loading) {
    return <p className="p-10">Chargement…</p>;
  }

 
return (
  <main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-7xl px-6 py-16">
      {/* Page heading */}
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        Prestations
      </p>

      <h1 className="mt-2 font-serif text-4xl text-foreground">
        Services
      </h1>

      <div className="mt-5 h-px w-16 bg-gold" />

      {/* Selected services notice */}
      {selectedServiceKeys.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/50 bg-gold/10 p-5">
          <p className="font-semibold text-foreground">
            {selectedServiceKeys.length} service(s) sélectionné(s)
          </p>

          <Link
            to={returnTo}
            className="rounded-full bg-gold px-5 py-3 font-semibold text-black transition-colors hover:bg-gold/90"
          >
            Continuer vers la réservation
          </Link>
        </div>
      )}

      {/* Services grid */}
      {services.length === 0 ? (
        <p className="mt-8 rounded-xl border border-foreground/15 bg-surface p-6 text-foreground/70">
          Les services seront publiés après réception du catalogue officiel.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const serviceKey = service.key ?? "";

            const selected = selectedServiceKeys.includes(serviceKey);

            const canSelect =
              serviceKey.length > 0 &&
              service.priceDZD !== undefined;

            return (
              <article
                key={service._id}
                className="group overflow-hidden rounded-2xl border border-foreground/10 bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-gold/50"
              >
                {/* Service image */}
                {service.image && (
                  <div className="overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.name[locale]}
                      loading="lazy"
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}

                {/* Service details */}
                <div className="p-6">
                  <p className="text-sm font-semibold text-gold">
                    {service.category}
                  </p>

                  <h2 className="mt-2 font-serif text-2xl text-foreground">
                    {service.name[locale]}
                  </h2>

                  <p className="mt-3 leading-relaxed text-foreground/70">
                    {service.description[locale]}
                  </p>

                  <div className="mt-5 border-t border-foreground/10 pt-4">
                    <p className="font-semibold text-foreground">
                      {service.priceDZD !== undefined
                        ? formatPrice(service.priceDZD)
                        : "Tarif communiqué lors de la réservation"}
                    </p>
                  </div>

                  {canSelect && (
                    <button
                      type="button"
                      onClick={() => toggleService(serviceKey)}
                      aria-pressed={selected}
                      className={
                        selected
                          ? "mt-5 rounded-full border border-gold bg-gold/10 px-5 py-3 font-semibold text-gold transition-colors hover:bg-gold/20"
                          : "mt-5 rounded-full bg-gold px-5 py-3 font-semibold text-black transition-colors hover:bg-gold/90"
                      }
                    >
                      {selected
                        ? "Retirer du panier"
                        : "Ajouter au panier"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  </main>
);

}