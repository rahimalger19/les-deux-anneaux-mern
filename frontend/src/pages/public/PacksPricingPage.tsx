import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { getPacks } from "../../services/catalog.service";
import type { Pack } from "../../types/catalog.types";
import { useCart } from "../../contexts/CartContext";

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PacksPricingPage() {
  const { language } = useLanguage();
  const { setPackKey } = useCart();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPacks()
      .then(setPacks)
      .finally(() => setLoading(false));
  }, []);

  const locale = language === "fr-DZ"
  ? "fr"
  : language === "ar-DZ"
    ? "ar"
    : "en";

  if (loading) return <p className="p-10">Loading packages...</p>;

  return (
    <section className="bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold">Packs et tarifs</h1>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {packs.map((pack) => (
            <article
              key={pack.key}
              className="rounded-2xl border border-foreground/15 bg-ivory p-6 dark:bg-black"
            >
              <h2 className="text-2xl font-semibold text-gold">
                {pack.name[locale]}
              </h2>

              <p className="mt-3 text-foreground/70">
                {pack.description[locale]}
              </p>

              <p className="mt-6 text-3xl font-bold">
                {formatDZD(pack.basePriceDZD)}
              </p>

              <p className="mt-1 text-sm text-foreground/60">
                Base price · extra guest: {formatDZD(pack.extraGuestPriceDZD)}
              </p>

              <ul className="mt-6 space-y-2 text-sm text-foreground/75">
                {pack.includedItems.map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>

           <Link
     to="/reservation"
     onClick={() => setPackKey(pack.key)}
     className="mt-6 inline-block rounded-full bg-gold px-5 py-3 font-semibold text-black">
  Réserver ce pack
</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}