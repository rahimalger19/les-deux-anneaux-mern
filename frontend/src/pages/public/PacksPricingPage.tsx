import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useCurrency } from "../../hooks/useCurrency";
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

export default function PacksPricingPage() {
  const { language, t } = useLanguage();
  const { setPackKey: setCartPackKey } = useCart();
  const { formatPrice } = useCurrency();

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

  function getSlotLabel(value: BookingSlot) {
    const labels = {
      AFTERNOON: t("pricing.slot.AFTERNOON"),
      EVENING: t("pricing.slot.EVENING"),
      NIGHT: t("pricing.slot.NIGHT"),
      DAY: t("pricing.slot.DAY"),
    };

    return labels[value];
  }

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
        setMessage(t("pricing.loadError"));
      })
      .finally(() => setLoading(false));
  }, [t]);

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
      setMessage(t("pricing.requiredFields"));
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
        error.response?.data?.message || t("pricing.estimateError")
      );
    } finally {
      setCalculating(false);
    }
  }

  if (loading) {
    return <p className="p-10">{t("pricing.loadError")}</p>;
  }

  return (
    <main className="bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          {t("pricing.eyebrow")}
        </p>

        <h1 className="mt-2 font-serif text-4xl">
          {t("pricing.title")}
        </h1>

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
            {t("pricing.resident")}
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
            {t("pricing.diaspora")}
          </button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {packs.map((pack) => {
            const isDiaspora = pricingMarket === "DIASPORA";

const basePrice = isDiaspora
  ? pack.diasporaBasePriceDZD
  : pack.basePriceDZD;

const extraGuestPrice = isDiaspora
  ? pack.diasporaExtraGuestPriceDZD
  : pack.extraGuestPriceDZD;

const displayName =
  isDiaspora && pack.diasporaName
    ? pack.diasporaName[locale]
    : pack.name[locale];

const displayDescription =
  isDiaspora && pack.diasporaDescription
    ? pack.diasporaDescription[locale]
    : pack.description[locale];

const displayIncludedItems = isDiaspora
  ? pack.diasporaIncludedItems ?? []
  : pack.includedItems;

const selected = selectedPackKey === pack.key;

             return (
            <article
              key={pack.key}
              className={`rounded-2xl border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 ${
                selected ? "border-gold ring-1 ring-gold/30" : "border-foreground/10"
              }`}
            >
              <h2 className="font-serif text-2xl text-gold">
                {displayName}
              </h2>

              <p className="mt-3 leading-relaxed text-foreground/70">
                {displayDescription}
              </p>

              {basePrice !== undefined ? (
                <>
                  <p className="mt-6 text-3xl font-bold text-foreground">
                    {formatPrice(basePrice)}
                  </p>

                  {extraGuestPrice !== undefined && (
                    <p className="mt-1 text-sm text-foreground/60">
                      {t("pricing.extraGuest")}:{" "}
                      {formatPrice(extraGuestPrice)}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-6 text-sm text-red-600 dark:text-red-300">
                  {t("pricing.unavailable")}
                </p>
              )}

              <ul className="mt-6 space-y-3 text-sm text-foreground/75">
                {displayIncludedItems.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="font-bold text-gold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => choosePack(pack.key)}
                className={
                  selected
                    ? "mt-6 rounded-full border border-gold bg-gold/10 px-5 py-3 font-semibold text-gold transition-colors hover:bg-gold/20"
                    : "mt-6 rounded-full bg-gold px-5 py-3 font-semibold text-black transition-colors hover:bg-gold/90"
                }
              >
                {selected
                  ? t("pricing.selected")
                  : t("pricing.choose")}
              </button>
            </article>
          );
        })}
      </div>

      {/* Estimate form */}
      <section className="mt-12 rounded-2xl border border-foreground/10 bg-surface p-6 sm:p-8">
        <h2 className="font-serif text-3xl text-foreground">
          {t("pricing.estimateTitle")}
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-foreground">
              {t("pricing.date")}
            </span>
            <input
              type="date"
              value={eventDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(event) => {
                setEventDate(event.target.value);
                clearEstimate();
              }}
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-field px-4 py-3 text-foreground outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-foreground">
              {t("pricing.eventType")}
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
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-field px-4 py-3 text-foreground outline-none focus:border-gold"
            >
              <option value="">{t("pricing.selectEvent")}</option>
              {eventTypes.map((eventType) => (
                <option key={eventType.key} value={eventType.key}>
                  {eventType.name[locale]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold text-foreground">
              {t("pricing.slot")}
            </span>
            <select
              value={slot}
              onChange={(event) => {
                setSlot(event.target.value as BookingSlot);
                clearEstimate();
              }}
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-field px-4 py-3 text-foreground outline-none focus:border-gold"
            >
              {slots.map((item) => {
                const allowed =
                  !selectedEventType ||
                  selectedEventType.allowedSlots.includes(item);

                return (
                  <option key={item} value={item} disabled={!allowed}>
                    {getSlotLabel(item)}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold text-foreground">
              {t("nav.pricing")}
            </span>
            <select
              value={selectedPackKey}
              onChange={(event) => choosePack(event.target.value)}
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-field px-4 py-3 text-foreground outline-none focus:border-gold"
            >
              <option value="">{t("pricing.selectPack")}</option>
              {packs.map((pack) => (
                <option key={pack.key} value={pack.key}>
                  {pack.name[locale]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold text-foreground">
              {t("pricing.womenGuests")}
            </span>
            <input
              type="number"
              min="0"
              value={womenGuests}
              onChange={(event) => {
                setWomenGuests(Number(event.target.value));
                clearEstimate();
              }}
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-field px-4 py-3 text-foreground outline-none focus:border-gold"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-foreground">
              {t("pricing.menGuests")}
            </span>
            <input
              type="number"
              min="0"
              value={menGuests}
              onChange={(event) => {
                setMenGuests(Number(event.target.value));
                clearEstimate();
              }}
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-field px-4 py-3 text-foreground outline-none focus:border-gold"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={calculateEstimate}
          disabled={calculating}
          className="mt-6 rounded-full bg-gold px-6 py-3 font-semibold text-black transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {calculating
            ? t("pricing.calculating")
            : t("pricing.calculate")}
        </button>

        {message && (
          <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-600 dark:text-red-300">
            {message}
          </p>
        )}

        {estimate && (
          <div className="mt-6 rounded-2xl border border-gold/50 bg-gold/10 p-6">
            <p className="text-sm text-foreground/70">
              {t("pricing.estimateTotal")}
            </p>
            <p className="mt-1 text-3xl font-bold text-foreground">
              {formatPrice(estimate.pricing.totalDZD)}
            </p>

            <p className="mt-4 text-sm text-foreground/70">
              {t("pricing.deposit")} (
              {estimate.eventType.depositPercent}%)
            </p>
            <p className="mt-1 text-2xl font-bold text-gold">
              {formatPrice(estimate.pricing.depositDZD)}
            </p>

            <Link
              to="/reservation"
              className="mt-6 inline-block rounded-full bg-gold px-6 py-3 font-semibold text-black transition-colors hover:bg-gold/90"
            >
              {t("pricing.continueBooking")}
            </Link>
          </div>
        )}
      </section>
    </div>
  </main>
);
}
