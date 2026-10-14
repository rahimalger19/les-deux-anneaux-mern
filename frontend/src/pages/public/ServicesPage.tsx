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
    <main className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        Prestations
      </p>

      <h1 className="mt-2 font-serif text-4xl">Services</h1>

      {selectedServiceKeys.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold bg-gold/10 p-5">
          <p className="font-semibold">
            {selectedServiceKeys.length} service(s) sélectionné(s)
          </p>

          <Link
            to={returnTo} 
            className="rounded-full bg-gold px-5 py-3 font-semibold text-black"
          >
            Continuer vers la réservation
          </Link>
        </div>
      )}

      {services.length === 0 ? (
        <p className="mt-8 rounded-xl border border-black/10 p-6 text-black/70">
          Les services seront publiés après réception du catalogue officiel.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {services.map((service) => {
            const serviceKey = service.key ?? "";

const selected = selectedServiceKeys.includes(serviceKey);

const canSelect =
  serviceKey.length > 0 && service.priceDZD !== undefined;

            return (
              <article
                key={service._id}
                className="rounded-2xl border border-black/10 bg-white p-6"
              >
                {service.image && (
                  <img
                    src={service.image}
                    alt={service.name[locale]}
                    className="mb-5 h-48 w-full rounded-xl object-cover"
                  />
                )}

                <p className="text-sm font-semibold text-gold">
                  {service.category}
                </p>

                <h2 className="mt-2 font-serif text-2xl">
                  {service.name[locale]}
                </h2>

                <p className="mt-3 text-black/70">
                  {service.description[locale]}
                </p>

                <p className="mt-5 font-semibold">
  {service.priceDZD !== undefined
    ? formatPrice(service.priceDZD)
    : "Tarif communiqué lors de la réservation"}
</p>

                {canSelect && (
                  <button
                    type="button"
                    onClick={() => toggleService(serviceKey)}
                    className={
                      selected
                        ? "mt-5 rounded-full border border-black px-5 py-3 font-semibold"
                        : "mt-5 rounded-full bg-gold px-5 py-3 font-semibold text-black"
                    }
                  >
                    {selected ? "Retirer du panier" : "Ajouter au panier"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}