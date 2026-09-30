import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import BookingStepper from "../../components/booking/BookingStepper";
import { useCart } from "../../contexts/CartContext";
import { useLanguage } from "../../hooks/useLanguage";
import {
  checkAvailability,
  createGuestDraft,
  estimateBooking,
  type EstimateResponse,
} from "../../services/booking.service";
import { getEventTypes, getPacks } from "../../services/catalog.service";
import type { EventType, Pack } from "../../types/catalog.types";
import type { BookingSlot } from "../../types/booking.types";

type PricingMarket = "RESIDENT" | "DIASPORA";

type ReservationDraft = {
  eventDate: string;
  slot: BookingSlot;
  eventTypeKey: string;
  packKey: string;
  womenGuests: number;
  menGuests: number;
  pricingMarket: PricingMarket;
  phone: string;
  available: boolean | null;
};

const storageKey = "les-deux-anneaux-reservation-wizard";

const emptyDraft: ReservationDraft = {
  eventDate: "",
  slot: "EVENING",
  eventTypeKey: "",
  packKey: "",
  womenGuests: 0,
  menGuests: 0,
  pricingMarket: "RESIDENT",
  phone: "",
  available: null,
};

const slots: Array<{
  value: BookingSlot;
  title: string;
  description: string;
}> = [
  { value: "AFTERNOON", title: "Après-midi", description: "12:00 – 18:00" },
  { value: "EVENING", title: "Soir", description: "18:00 – 00:00" },
  { value: "NIGHT", title: "Nuit", description: "00:00 – 06:00" },
  { value: "DAY", title: "Journée", description: "09:00 – 23:00" },
];

function loadDraft(): ReservationDraft {
  try {
    const stored = sessionStorage.getItem(storageKey);

    if (!stored) {
      return emptyDraft;
    }

    return {
      ...emptyDraft,
      ...JSON.parse(stored),
    };
  } catch {
    return emptyDraft;
  }
}

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ReservationPage() {
  const { step } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const {
    optionKeys,
    packKey: cartPackKey,
    setPackKey: setCartPackKey,
  } = useCart();

  const [draft, setDraft] = useState<ReservationDraft>(loadDraft);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [estimate, setEstimate] =
    useState<EstimateResponse["estimate"] | null>(null);

  const locale =
    language === "fr-DZ" ? "fr" : language === "ar-DZ" ? "ar" : "en";

  const selectedEventType = eventTypes.find(
    (eventType) => eventType.key === draft.eventTypeKey
  );

  const selectedPack = packs.find((pack) => pack.key === draft.packKey);

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    Promise.all([getEventTypes(), getPacks()])
      .then(([eventTypesData, packsData]) => {
        setEventTypes(eventTypesData);
        setPacks(packsData);
      })
      .catch(() => {
        setMessage("Impossible de charger le catalogue.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!draft.packKey && cartPackKey) {
      setDraft((current) => ({
        ...current,
        packKey: cartPackKey,
      }));
    }
  }, [cartPackKey, draft.packKey]);

  function updateDraft(values: Partial<ReservationDraft>) {
    setDraft((current) => ({
      ...current,
      ...values,
    }));

    setEstimate(null);
    setMessage("");
  }

  async function handleAvailability() {
    if (!draft.eventDate || !draft.eventTypeKey) {
      setMessage("Choisissez une date et un type d’événement.");
      return;
    }

    setChecking(true);
    setMessage("");

    try {
      const result = await checkAvailability(draft.eventDate, draft.slot);

      updateDraft({ available: result.available });

      if (!result.available) {
        setMessage("Ce créneau est déjà réservé.");
        return;
      }

      navigate("/reservation/details");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de vérifier la disponibilité."
      );
    } finally {
      setChecking(false);
    }
  }

  function continueToQuote() {
    if (!draft.packKey || draft.womenGuests + draft.menGuests < 1) {
      setMessage("Choisissez un pack et indiquez au moins un invité.");
      return;
    }

    navigate("/reservation/devis");
  }

  async function handleCalculate() {
    setCalculating(true);
    setMessage("");
    setEstimate(null);

    try {
      const result = await estimateBooking({
        eventDate: draft.eventDate,
        eventTypeKey: draft.eventTypeKey,
        packKey: draft.packKey,
        womenGuests: draft.womenGuests,
        menGuests: draft.menGuests,
        slot: draft.slot,
        pricingMarket: draft.pricingMarket,
        optionKeys,
      });

      setEstimate(result.estimate);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de calculer votre devis."
      );
    } finally {
      setCalculating(false);
    }
  }

  async function handleSendOtp() {
    if (!estimate) {
      setMessage("Calculez votre devis avant de continuer.");
      return;
    }

    if (draft.phone.trim().length < 8) {
      setMessage("Saisissez un numéro de téléphone valide.");
      return;
    }

    setSendingOtp(true);
    setMessage("");

    try {
      const result = await createGuestDraft({
        eventDate: draft.eventDate,
        slot: draft.slot,
        eventTypeKey: draft.eventTypeKey,
        packKey: draft.packKey,
        womenGuests: draft.womenGuests,
        menGuests: draft.menGuests,
        phone: draft.phone,
        pricingMarket: draft.pricingMarket,
        optionKeys,
      });

      sessionStorage.removeItem(storageKey);

      navigate(
        `/otp?bookingId=${result.bookingId}&token=${result.trackingToken}`,
        {
          state: {
            developmentOtp: result.developmentOtp,
            expiresInSeconds: result.expiresInSeconds,
          },
        }
      );
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d’envoyer le code OTP."
      );
    } finally {
      setSendingOtp(false);
    }
  }

  if (!["creneau", "details", "devis"].includes(step || "")) {
    return <Navigate to="/reservation/creneau" replace />;
  }

  if (step === "details" && draft.available !== true) {
    return <Navigate to="/reservation/creneau" replace />;
  }

  if (
    step === "devis" &&
    (!draft.available ||
      !draft.eventTypeKey ||
      !draft.packKey ||
      draft.womenGuests + draft.menGuests < 1)
  ) {
    return <Navigate to="/reservation/details" replace />;
  }

  if (loading) {
    return <p className="p-10">Chargement de la réservation…</p>;
  }

  const currentStep = step === "creneau" ? 1 : step === "details" ? 2 : 3;

  return (
    <main className="min-h-[70vh] bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Réservation en ligne
        </p>

        <h1 className="mt-3 font-serif text-4xl">
          Préparer votre réservation
        </h1>

        <BookingStepper currentStep={currentStep} />

        {message && (
          <p className="mt-8 rounded-xl bg-red-100 p-4 text-red-800">
            {message}
          </p>
        )}

        {step === "creneau" && (
          <section className="mt-10 rounded-2xl border border-foreground/15 p-6">
            <h2 className="font-serif text-3xl">Choisissez votre créneau</h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <label>
                <span className="text-sm font-semibold">Date</span>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={draft.eventDate}
                  onChange={(event) =>
                    updateDraft({
                      eventDate: event.target.value,
                      available: null,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-semibold">
                  Type d’événement
                </span>
                <select
                  value={draft.eventTypeKey}
                  onChange={(event) => {
                    const eventType = eventTypes.find(
                      (item) => item.key === event.target.value
                    );

                    updateDraft({
                      eventTypeKey: event.target.value,
                      slot:
                        eventType &&
                        !eventType.allowedSlots.includes(draft.slot)
                          ? eventType.allowedSlots[0]
                          : draft.slot,
                      available: null,
                    });
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
            </div>

            <p className="mt-8 text-sm font-semibold">Créneau souhaité</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {slots.map((item) => {
                const allowed =
                  !selectedEventType ||
                  selectedEventType.allowedSlots.includes(item.value);

                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={!allowed}
                    onClick={() =>
                      updateDraft({
                        slot: item.value,
                        available: null,
                      })
                    }
                    className={`rounded-xl border p-5 text-left transition ${
                      draft.slot === item.value
                        ? "border-gold bg-gold text-black"
                        : "border-foreground/20"
                    } ${!allowed ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    <strong className="block">{item.title}</strong>
                    <span className="mt-1 block text-sm opacity-75">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAvailability}
              disabled={checking}
              className="mt-8 rounded-full bg-black px-6 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
            >
              {checking ? "Vérification…" : "Vérifier la disponibilité"}
            </button>
          </section>
        )}

        {step === "details" && (
          <section className="mt-10 rounded-2xl border border-foreground/15 p-6">
            <h2 className="font-serif text-3xl">Configurez votre événement</h2>

            <p className="mt-3 text-foreground/70">
              {selectedEventType?.name[locale]} · {draft.eventDate} ·{" "}
              {draft.slot}
            </p>

            <div className="mt-8">
              <p className="text-sm font-semibold">Grille tarifaire</p>

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    updateDraft({ pricingMarket: "RESIDENT" })
                  }
                  className={
                    draft.pricingMarket === "RESIDENT"
                      ? "rounded-full bg-gold px-5 py-3 font-semibold text-black"
                      : "rounded-full border border-foreground/20 px-5 py-3"
                  }
                >
                  Résidence DZ
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateDraft({ pricingMarket: "DIASPORA" })
                  }
                  className={
                    draft.pricingMarket === "DIASPORA"
                      ? "rounded-full bg-gold px-5 py-3 font-semibold text-black"
                      : "rounded-full border border-foreground/20 px-5 py-3"
                  }
                >
                  Diaspora / immigrants
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <label>
                <span className="text-sm font-semibold">Invitées femmes</span>
                <input
                  type="number"
                  min="0"
                  value={draft.womenGuests}
                  onChange={(event) =>
                    updateDraft({
                      womenGuests: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm font-semibold">Invités hommes</span>
                <input
                  type="number"
                  min="0"
                  value={draft.menGuests}
                  onChange={(event) =>
                    updateDraft({
                      menGuests: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                />
              </label>
            </div>

            <h3 className="mt-10 font-serif text-2xl">Choisissez votre pack</h3>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {packs.map((pack) => {
                const price =
                  draft.pricingMarket === "DIASPORA"
                    ? pack.diasporaBasePriceDZD
                    : pack.basePriceDZD;

                const selected = draft.packKey === pack.key;

                return (
                  <button
                    key={pack.key}
                    type="button"
                    onClick={() => {
                      updateDraft({ packKey: pack.key });
                      setCartPackKey(pack.key);
                    }}
                    className={`rounded-2xl border p-5 text-left ${
                      selected
                        ? "border-gold bg-gold/10"
                        : "border-foreground/15"
                    }`}
                  >
                    <strong className="font-serif text-xl text-gold">
                      {pack.name[locale]}
                    </strong>

                    <span className="mt-3 block text-sm text-foreground/70">
                      {pack.description[locale]}
                    </span>

                    {price !== undefined && (
                      <span className="mt-4 block font-bold">
                        {formatDZD(price)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-7 rounded-xl bg-foreground/5 p-4 text-sm">
              {optionKeys.length > 0 ? (
                <p>{optionKeys.length} option(s) sélectionnée(s).</p>
              ) : (
                <p>Aucune option supplémentaire sélectionnée.</p>
              )}

              <Link
  to="/services"
  state={{ returnTo: "/reservation/details" }}
  className="mt-2 inline-block font-semibold text-gold underline underline-offset-4"
>
  Gérer les options
</Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/reservation/creneau")}
                className="rounded-full border border-foreground/20 px-6 py-3 font-semibold"
              >
                Retour
              </button>

              <button
                type="button"
                onClick={continueToQuote}
                className="rounded-full bg-gold px-6 py-3 font-semibold text-black"
              >
                Continuer vers le devis
              </button>
            </div>
          </section>
        )}

        {step === "devis" && (
          <section className="mt-10 rounded-2xl border border-foreground/15 p-6">
            <h2 className="font-serif text-3xl">Votre devis</h2>

            <div className="mt-6 grid gap-4 rounded-xl bg-foreground/5 p-5 sm:grid-cols-2">
              <p>
                <span className="block text-sm text-foreground/60">Date</span>
                <strong>{draft.eventDate}</strong>
              </p>

              <p>
                <span className="block text-sm text-foreground/60">
                  Créneau
                </span>
                <strong>{draft.slot}</strong>
              </p>

              <p>
                <span className="block text-sm text-foreground/60">
                  Événement
                </span>
                <strong>{selectedEventType?.name[locale]}</strong>
              </p>

              <p>
                <span className="block text-sm text-foreground/60">Pack</span>
                <strong>{selectedPack?.name[locale]}</strong>
              </p>
            </div>

            {!estimate ? (
              <button
                type="button"
                onClick={handleCalculate}
                disabled={calculating}
                className="mt-7 rounded-full bg-gold px-6 py-3 font-semibold text-black"
              >
                {calculating ? "Calcul…" : "Calculer mon devis"}
              </button>
            ) : (
              <div className="mt-7 rounded-2xl border border-gold bg-gold/10 p-6">
                <p className="text-sm text-foreground/60">Total estimé</p>
                <p className="mt-1 text-3xl font-bold">
                  {formatDZD(estimate.pricing.totalDZD)}
                </p>

                <p className="mt-5 text-sm text-foreground/60">
                  Acompte ({estimate.eventType.depositPercent}%)
                </p>

                <p className="mt-1 text-2xl font-bold text-gold">
                  {formatDZD(estimate.pricing.depositDZD)}
                </p>

                <label className="mt-7 block">
                  <span className="text-sm font-semibold">
                    Numéro de téléphone
                  </span>

                  <input
                    type="tel"
                    placeholder="0555000000"
                    value={draft.phone}
                    onChange={(event) => {
  setDraft((current) => ({
    ...current,
    phone: event.target.value,
  }));

  setMessage("");
}}
                    className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="mt-5 rounded-full bg-black px-6 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
                >
                  {sendingOtp
                    ? "Envoi…"
                    : "Recevoir le code OTP et confirmer"}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate("/reservation/details")}
              className="mt-7 rounded-full border border-foreground/20 px-6 py-3 font-semibold"
            >
              Retour
            </button>
          </section>
        )}
      </div>
    </main>
  );
}