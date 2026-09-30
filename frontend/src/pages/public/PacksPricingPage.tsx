import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { getEventTypes, getPacks } from "../../services/catalog.service";
import {
  estimateBooking,
  type EstimateResponse,
} from "../../services/booking.service";
import { useLanguage } from "../../hooks/useLanguage";
import type { EventType, Pack } from "../../types/catalog.types";
import type { BookingSlot } from "../../types/booking.types";

type PricingMarket = "RESIDENT" | "DIASPORA";

const slots: BookingSlot[] = ["AFTERNOON", "EVENING", "NIGHT", "DAY"];

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PacksPricingPage() {
  const { language } = useLanguage();
  const { setPackKey: setCartPackKey } = useCart();

  const [packs, setPacks] = useState<Pack[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [pricingMarket, setPricingMarket] =
    useState<PricingMarket>("RESIDENT");
  const [selectedPackKey, setSelectedPackKey] = useState("");
  const [eventTypeKey, setEventTypeKey] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [slot, setSlot] = useState<BookingSlot>("EVENING");
  const [womenGuests, setWomenGuests] = useState(0);
  const [menGuests, setMenGuests] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [estimate, setEstimate] =
    useState<EstimateResponse["estimate"] | null>(null);

  const locale =
    language === "fr-DZ" ? "fr" : language === "ar-DZ" ? "ar" : "en";

  const selectedEventType = eventTypes.find(
    (eventType) => eventType.key === eventTypeKey
  );

  useEffect(() => {
    Promise.all([getPacks(), getEventTypes()])
      .then(([packsData, eventTypesData]) => {
        setPacks(packsData);
        setEventTypes(eventTypesData);
      })
      .catch(() => {
        setMessage("Impossible de charger les packs et tarifs.");
      })
      .finally(() => setLoading(false));
  }, []);

  function clearEstimate() {
    setEstimate(null);
    setMessage("");
  }

  function choosePack(packKey: string) {
    setSelectedPackKey(packKey);
    setCartPackKey(packKey);
    clearEstimate();
  }

  async function calculateEstimate() {
    if (
      !selectedPackKey ||
      !eventTypeKey ||
      !eventDate ||
      womenGuests + menGuests < 1
    ) {
      setMessage(
        "Choisissez une date, un événement, un pack et au moins un invité."
      );
      return;
    }

    setCalculating(true);
    setMessage("");
    setEstimate(null);

    try {
      const result = await estimateBooking({
        eventDate,
        eventTypeKey,
        packKey: selectedPackKey,
        womenGuests,
        menGuests,
        slot,
        pricingMarket,
        optionKeys: [],
      });

      setEstimate(result.estimate);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de calculer l'estimation."
      );
    } finally {
      setCalculating(false);
    }
  }

  if (loading) {
    return <p className="p-10">Chargement des packs…</p>;
  }

  return (
    <main className="bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Offres et tarifs
        </p>

        <h1 className="mt-2 font-serif text-4xl">Packs et tarifs</h1>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setPricingMarket("RESIDENT");
              clearEstimate();
            }}
            className={
              pricingMarket === "RESIDENT"
                ? "rounded-full bg-gold px-5 py-3 font-semibold text-black"
                : "rounded-full border border-foreground/20 px-5 py-3"
            }
          >
            Résidence DZ
          </button>

          <button
            type="button"
            onClick={() => {
              setPricingMarket("DIASPORA");
              clearEstimate();
            }}
            className={
              pricingMarket === "DIASPORA"
                ? "rounded-full bg-gold px-5 py-3 font-semibold text-black"
                : "rounded-full border border-foreground/20 px-5 py-3"
            }
          >
            Diaspora / immigrants
          </button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {packs.map((pack) => {
            const basePrice =
              pricingMarket === "DIASPORA"
                ? pack.diasporaBasePriceDZD
                : pack.basePriceDZD;

            const extraGuestPrice =
              pricingMarket === "DIASPORA"
                ? pack.diasporaExtraGuestPriceDZD
                : pack.extraGuestPriceDZD;

            const selected = selectedPackKey === pack.key;

            return (
              <article
                key={pack.key}
                className={`rounded-2xl border bg-ivory p-6 dark:bg-black ${
                  selected ? "border-gold" : "border-foreground/15"
                }`}
              >
                <h2 className="font-serif text-2xl text-gold">
                  {pack.name[locale]}
                </h2>

                <p className="mt-3 text-foreground/70">
                  {pack.description[locale]}
                </p>

                {basePrice !== undefined ? (
                  <>
                    <p className="mt-6 text-3xl font-bold">
                      {formatDZD(basePrice)}
                    </p>

                    {extraGuestPrice !== undefined && (
                      <p className="mt-1 text-sm text-foreground/60">
                        Invité supplémentaire : {formatDZD(extraGuestPrice)}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-6 text-sm text-red-700">
                    Tarif Diaspora temporairement indisponible.
                  </p>
                )}

                <ul className="mt-6 space-y-2 text-sm text-foreground/75">
                  {pack.includedItems.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => choosePack(pack.key)}
                  className={
                    selected
                      ? "mt-6 rounded-full border border-gold px-5 py-3 font-semibold text-gold"
                      : "mt-6 rounded-full bg-gold px-5 py-3 font-semibold text-black"
                  }
                >
                  {selected ? "Pack sélectionné" : "Choisir ce pack"}
                </button>
              </article>
            );
          })}
        </div>

        <section className="mt-12 rounded-2xl border border-foreground/15 p-6">
          <h2 className="font-serif text-3xl">Estimer ma réservation</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold">Date</span>
              <input
                type="date"
                value={eventDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => {
                  setEventDate(event.target.value);
                  clearEstimate();
                }}
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>

            <label>
              <span className="text-sm font-semibold">
                Type d'événement
              </span>
              <select
                value={eventTypeKey}
                onChange={(event) => {
                  const value = event.target.value;
                  const eventType = eventTypes.find(
                    (item) => item.key === value
                  );

                  setEventTypeKey(value);

                  if (
                    eventType &&
                    !eventType.allowedSlots.includes(slot) &&
                    eventType.allowedSlots[0]
                  ) {
                    setSlot(eventType.allowedSlots[0]);
                  }

                  clearEstimate();
                }}
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              >
                <option value="">Choisir un événement</option>
                {eventTypes.map((eventType) => (
                  <option key={eventType.key} value={eventType.key}>
                    {eventType.name[locale]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold">Créneau</span>
              <select
                value={slot}
                onChange={(event) => {
                  setSlot(event.target.value as BookingSlot);
                  clearEstimate();
                }}
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              >
                {slots.map((item) => {
                  const allowed =
                    !selectedEventType ||
                    selectedEventType.allowedSlots.includes(item);

                  return (
                    <option key={item} value={item} disabled={!allowed}>
                      {item}
                    </option>
                  );
                })}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold">Pack</span>
              <select
                value={selectedPackKey}
                onChange={(event) => choosePack(event.target.value)}
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              >
                <option value="">Choisir un pack</option>
                {packs.map((pack) => (
                  <option key={pack.key} value={pack.key}>
                    {pack.name[locale]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold">Invitées femmes</span>
              <input
                type="number"
                min="0"
                value={womenGuests}
                onChange={(event) => {
                  setWomenGuests(Number(event.target.value));
                  clearEstimate();
                }}
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>

            <label>
              <span className="text-sm font-semibold">Invités hommes</span>
              <input
                type="number"
                min="0"
                value={menGuests}
                onChange={(event) => {
                  setMenGuests(Number(event.target.value));
                  clearEstimate();
                }}
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={calculateEstimate}
            disabled={calculating}
            className="mt-6 rounded-full bg-gold px-6 py-3 font-semibold text-black"
          >
            {calculating ? "Calcul…" : "Calculer mon estimation"}
          </button>

          {message && (
            <p className="mt-5 rounded-xl bg-red-100 p-4 text-red-800">
              {message}
            </p>
          )}

          {estimate && (
            <div className="mt-6 rounded-2xl border border-gold bg-gold/10 p-6">
              <p className="text-sm text-foreground/70">Total estimé</p>
              <p className="mt-1 text-3xl font-bold">
                {formatDZD(estimate.pricing.totalDZD)}
              </p>

              <p className="mt-4 text-sm text-foreground/70">
                Acompte ({estimate.eventType.depositPercent}%)
              </p>
              <p className="mt-1 text-2xl font-bold text-gold">
                {formatDZD(estimate.pricing.depositDZD)}
              </p>

              <Link
                to="/reservation"
                className="mt-6 inline-block rounded-full bg-black px-6 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
              >
                Continuer vers la réservation
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}