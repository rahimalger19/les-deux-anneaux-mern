import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  checkAvailability,
  createGuestDraft,
  estimateBooking,
  verifyGuestOtp,
  type EstimateResponse,
  type GuestDraftResponse,
} from "../../services/booking.service";
import {
  getEventTypes,
  getPacks,
} from "../../services/catalog.service";
import { useLanguage } from "../../hooks/useLanguage";
import type { EventType, Pack } from "../../types/catalog.types";
import type { BookingSlot } from "../../types/booking.types";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import { saveMyBookingDraft } from "../../services/booking.service";
import { trackAnalyticsEvent } from "../../services/analytics.service";


type PricingMarket = "RESIDENT" | "DIASPORA";

const slots: Array<{
  value: BookingSlot;
  title: string;
  description: string;
}> = [
  { value: "AFTERNOON", title: "Après-midi", description: "12:00 - 18:00" },
  { value: "EVENING", title: "Soir", description: "18:00 - 00:00" },
  { value: "NIGHT", title: "Nuit", description: "00:00 - 06:00" },
  { value: "DAY", title: "Journée", description: "09:00 - 23:00" },
];

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export default function ReservationPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

const {
  spaceKey,
  packKey: cartPackKey,
  optionKeys,
  setPackKey: setCartPackKey,
} = useCart();

const [draftMessage, setDraftMessage] = useState("");
const [savingDraft, setSavingDraft] = useState(false);
  const locale = language === "fr-DZ"
  ? "fr"
  : language === "ar-DZ"
    ? "ar"
    : "en";

  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<BookingSlot>("EVENING");
  const [eventTypeKey, setEventTypeKey] = useState("");
  const [packKey, setPackKey] = useState("");
  const [womenGuests, setWomenGuests] = useState(0);
  const [menGuests, setMenGuests] = useState(0);
const [pricingMarket, setPricingMarket] =
  useState<PricingMarket>("RESIDENT");

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);

  const [available, setAvailable] = useState<boolean | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [estimate, setEstimate] = useState<EstimateResponse["estimate"] | null>(
    null
  );
  const [estimateMessage, setEstimateMessage] = useState("");
  const [calculating, setCalculating] = useState(false);

  const [phone, setPhone] = useState("");
  const [guestDraft, setGuestDraft] = useState<GuestDraftResponse | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const lastTrackedEstimateKey = useRef<string | null>(null);
const trackedDraftIds = useRef<Set<string>>(new Set());
const trackedOtpBookingIds = useRef<Set<string>>(new Set());

function recordAnalytics(
  type:
    | "RESERVATION_ESTIMATE"
    | "BOOKING_DRAFT_CREATED"
    | "OTP_VERIFIED"
) {
  void trackAnalyticsEvent(type).catch(() => undefined);
}

  const selectedEventType = useMemo(
    () => eventTypes.find((item) => item.key === eventTypeKey),
    [eventTypes, eventTypeKey]
  );

  useEffect(() => {
    Promise.all([getEventTypes(), getPacks()])
      .then(([eventTypesData, packsData]) => {
        setEventTypes(eventTypesData);
        setPacks(packsData);
      })
      .finally(() => setLoadingCatalogue(false));
  }, []);

  useEffect(() => {
  if (
    cartPackKey &&
    packs.some((pack) => pack.key === cartPackKey)
  ) {
    setPackKey(cartPackKey);
  }
}, [cartPackKey, packs]);

  useEffect(() => {
  if (!holdExpiresAt) return;

  function updateCountdown() {
    const seconds = Math.max(
      0,
      Math.floor(
       holdExpiresAt
  ? (new Date(holdExpiresAt).getTime() - new Date().getTime()) / 1000
  : 0
      )
    );

    setSecondsRemaining(seconds);
  }

  updateCountdown();

  const timer = window.setInterval(
    updateCountdown,
    1000
  );

  return () => window.clearInterval(timer);
}, [holdExpiresAt]);

  function resetGuestFlow() {
    setGuestDraft(null);
    setOtpCode("");
    setGuestMessage("");
    setHoldExpiresAt(null);
    setSecondsRemaining(0);
  }

  function resetAvailabilityAndEstimate() {
    setAvailable(null);
    setAvailabilityMessage("");
    setEstimate(null);
    setEstimateMessage("");
    resetGuestFlow();
  }

  function handleEventTypeChange(value: string) {
    const eventType = eventTypes.find((item) => item.key === value);

    setEventTypeKey(value);
    resetAvailabilityAndEstimate();

    if (eventType && !eventType.allowedSlots.includes(slot)) {
      setSlot(eventType.allowedSlots[0]);
    }
  }

  async function handleCheckAvailability() {
    if (!date) {
      setAvailabilityMessage("Veuillez choisir une date.");
      return;
    }

    setCheckingAvailability(true);
    setEstimate(null);
    resetGuestFlow();

    try {
      const result = await checkAvailability(date, slot);

      setAvailable(result.available);
      setAvailabilityMessage(
        result.available
          ? "Ce créneau est disponible."
          : "Ce créneau est déjà réservé."
      );
    } catch (error: any) {
      setAvailable(null);
      setAvailabilityMessage(
        error.response?.data?.message ||
          "Impossible de vérifier la disponibilité."
      );
    } finally {
      setCheckingAvailability(false);
    }
  }

  async function handleCalculateEstimate() {
    if (!available) {
      setEstimateMessage("Vérifiez d'abord la disponibilité.");
      return;
    }

    if (!eventTypeKey || !packKey) {
      setEstimateMessage("Choisissez un événement et un pack.");
      return;
    }

    if (womenGuests + menGuests < 1) {
      setEstimateMessage("Indiquez au moins un invité.");
      return;
    }

    setCalculating(true);
    setEstimateMessage("");
    setEstimate(null);
    resetGuestFlow();

    try {
      const result = await estimateBooking({
        eventDate: date,
        eventTypeKey,
        packKey,
        womenGuests,
        menGuests,
        slot,
        pricingMarket,
        optionKeys,
      });

      setEstimate(result.estimate);
      const estimateKey = [
  date,
  slot,
  eventTypeKey,
  packKey,
  womenGuests,
  menGuests,
  pricingMarket,
  [...optionKeys].sort().join(","),
].join("|");

if (lastTrackedEstimateKey.current !== estimateKey) {
  lastTrackedEstimateKey.current = estimateKey;
  recordAnalytics("RESERVATION_ESTIMATE");
}
    } catch (error: any) {
      setEstimateMessage(
        error.response?.data?.message || "Impossible de calculer le devis."
      );
    } finally {
      setCalculating(false);
    }
  }

  async function handleSendOtp() {
    if (!estimate) {
      setGuestMessage("Calculez votre devis avant de continuer.");
      return;
    }

    if (phone.trim().length < 8) {
      setGuestMessage("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    setSendingOtp(true);
    setGuestMessage("");

    try {
      const result = await createGuestDraft({
        eventDate: date,
        slot,
        eventTypeKey,
        packKey,
        womenGuests,
        menGuests,
        phone,
        pricingMarket,
        optionKeys,
      });
      if (!trackedDraftIds.current.has(result.bookingId)) {
  trackedDraftIds.current.add(result.bookingId);
  recordAnalytics("BOOKING_DRAFT_CREATED");
}
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
      setGuestMessage(
        error.response?.data?.message || "Impossible d'envoyer le code OTP."
      );
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (!guestDraft) return;

    if (!/^\d{6}$/.test(otpCode)) {
      setGuestMessage("Le code OTP doit contenir exactement 6 chiffres.");
      return;
    }

    setVerifyingOtp(true);
    setGuestMessage("");

    try {
      const result = await verifyGuestOtp(guestDraft.bookingId, otpCode);

      setHoldExpiresAt(result.holdExpiresAt);
      setGuestMessage(result.message);
      if (!trackedOtpBookingIds.current.has(guestDraft.bookingId)) {
  trackedOtpBookingIds.current.add(guestDraft.bookingId);
  recordAnalytics("OTP_VERIFIED");
}
    } catch (error: any) {
      setGuestMessage(
        error.response?.data?.message || "Impossible de vérifier le code OTP."
      );
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleSaveDraft() {
  if (!user) {
    navigate("/connexion");
    return;
  }

  if (!date || !eventTypeKey || !packKey || womenGuests + menGuests < 1) {
    setDraftMessage(
      "Choisissez une date, un événement, un pack et au moins un invité."
    );
    return;
  }

  setSavingDraft(true);
  setDraftMessage("");

  try {
    await saveMyBookingDraft({
      eventDate: date,
      slot,
      eventTypeKey,
      packKey,
      womenGuests,
      menGuests,
      pricingMarket,
      spaceKey,
      optionKeys,
    });

    setDraftMessage("Brouillon enregistré dans votre espace client.");
    recordAnalytics("BOOKING_DRAFT_CREATED");
  } catch (error: any) {
    setDraftMessage(
      error.response?.data?.message ||
        "Impossible d'enregistrer le brouillon."
    );
  } finally {
    setSavingDraft(false);
  }
}

  if (loadingCatalogue) {
    return <p className="p-10">Chargement de la réservation...</p>;
  }

  return (
    <section className="min-h-[70vh] bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Réservation en ligne
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Préparer votre réservation
        </h1>

<div className="mb-8">
  <p className="text-sm font-semibold">Grille tarifaire</p>

  <div className="mt-3 flex flex-wrap gap-3">
    <button
      type="button"
      onClick={() => {
        setPricingMarket("RESIDENT");
        resetAvailabilityAndEstimate();
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
        resetAvailabilityAndEstimate();
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
</div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <label>
            <span className="text-sm font-semibold">Date</span>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(event) => {
                setDate(event.target.value);
                resetAvailabilityAndEstimate();
              }}
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">Type d'événement</span>
            <select
              value={eventTypeKey}
              onChange={(event) => handleEventTypeChange(event.target.value)}
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
                onClick={() => {
                  setSlot(item.value);
                  resetAvailabilityAndEstimate();
                }}
                className={`rounded-xl border p-4 text-left ${
                  slot === item.value
                    ? "border-gold bg-gold text-black"
                    : "border-foreground/20"
                } ${!allowed ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <strong className="block">{item.title}</strong>
                <span className="text-sm opacity-75">{item.description}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleCheckAvailability}
          disabled={checkingAvailability}
          className="mt-6 rounded-full bg-black px-6 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
        >
          {checkingAvailability
            ? "Vérification..."
            : "Vérifier la disponibilité"}
        </button>

        {availabilityMessage && (
          <p className="mt-4 rounded-xl bg-yellow-100 p-4 text-yellow-800">
            {availabilityMessage}
          </p>
        )}

        <div className="mt-10 grid gap-6 border-t border-foreground/15 pt-10 md:grid-cols-2">
          <label>
            <span className="text-sm font-semibold">Pack</span>
            <select
              value={packKey}
              onChange={(event) => {
  const value = event.target.value;

  setPackKey(value);
  setCartPackKey(value || null);
  setEstimate(null);
  resetGuestFlow();
}}
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

          <div>
            <p className="text-sm font-semibold">Nombre d'invités</p>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <label>
                <span className="text-sm">Femmes</span>
                <input
                  type="number"
                  min="0"
                  value={womenGuests}
                  onChange={(event) => {
                    setWomenGuests(Number(event.target.value));
                    setEstimate(null);
                    resetGuestFlow();
                  }}
                  className="mt-1 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Hommes</span>
                <input
                  type="number"
                  min="0"
                  value={menGuests}
                  onChange={(event) => {
                    setMenGuests(Number(event.target.value));
                    setEstimate(null);
                    resetGuestFlow();
                  }}
                  className="mt-1 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCalculateEstimate}
          disabled={calculating}
          className="mt-8 rounded-full bg-gold px-6 py-3 font-semibold text-black"
        >
          {calculating ? "Calcul..." : "Calculer mon devis"}
        </button>

        {user && (
  <button
    type="button"
    onClick={handleSaveDraft}
    disabled={savingDraft}
    className="ml-3 mt-8 rounded-full border border-gold px-6 py-3 font-semibold text-gold"
  >
    {savingDraft ? "Enregistrement..." : "Enregistrer le brouillon"}
  </button>
)}

{optionKeys.length > 0 && (
  <p className="mt-4 text-sm text-foreground/70">
    {optionKeys.length} option(s) sélectionnée(s) depuis la page Services.
  </p>
)}

{draftMessage && (
  <p className="mt-4 rounded-xl bg-green-100 p-4 text-green-800">
    {draftMessage}
  </p>
)}

        {estimateMessage && (
          <p className="mt-4 rounded-xl bg-red-100 p-4 text-red-800">
            {estimateMessage}
          </p>
        )}

        {estimate && (
          <section className="mt-8 rounded-2xl border border-gold p-6">
            <h2 className="text-2xl font-bold text-gold">Votre estimation</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-foreground/60">Total estimé</p>
                <p className="text-3xl font-bold">
                  {formatDZD(estimate.pricing.totalDZD)}
                </p>
              </div>

              <div>
                <p className="text-sm text-foreground/60">
                  Acompte ({estimate.eventType.depositPercent}%)
                </p>
                <p className="text-3xl font-bold text-gold">
                  {formatDZD(estimate.pricing.depositDZD)}
                </p>
              </div>

               {estimate.pricing.selectedServicesDZD > 0 && (
  <div>
    <p className="text-sm text-foreground/60">
      Services sélectionnés
    </p>

    <p className="text-xl font-bold">
      {formatDZD(estimate.pricing.selectedServicesDZD)}
    </p>
  </div>
)}

            </div>

            <div className="mt-8 border-t border-foreground/15 pt-6">
              <label>
                <span className="text-sm font-semibold">
                  Numéro de téléphone
                </span>

                <input
                  type="tel"
                  placeholder="0555000000"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    resetGuestFlow();
                  }}
                  className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                />
              </label>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="mt-4 rounded-full bg-black px-6 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
              >
                {sendingOtp ? "Envoi..." : "Recevoir le code OTP"}
              </button>
            </div>
          </section>
        )}

        {guestDraft && !holdExpiresAt && (
          <section className="mt-8 rounded-2xl border border-gold p-6">
            <h2 className="text-2xl font-bold text-gold">Confirmer votre code</h2>

            {guestDraft.developmentOtp && (
              <p className="mt-4 rounded-xl bg-yellow-100 p-4 text-yellow-900">
                Développement uniquement — votre code OTP est :
                <strong className="ml-2 text-xl">
                  {guestDraft.developmentOtp}
                </strong>
              </p>
            )}

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Code à 6 chiffres"
              value={otpCode}
              onChange={(event) =>
                setOtpCode(event.target.value.replace(/\D/g, ""))
              }
              className="mt-5 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifyingOtp}
              className="mt-4 rounded-full bg-gold px-6 py-3 font-semibold text-black"
            >
              {verifyingOtp ? "Vérification..." : "Vérifier le code OTP"}
            </button>
          </section>
        )}

        {guestMessage && (
          <p className="mt-5 rounded-xl bg-green-100 p-4 text-green-800">
            {guestMessage}
          </p>
        )}

        {holdExpiresAt && guestDraft && (
          <section className="mt-8 rounded-2xl border border-gold bg-gold/10 p-6">
            <h2 className="text-2xl font-bold text-gold">
              Créneau bloqué temporairement
            </h2>

            <p className="mt-4">
              Temps restant pour envoyer votre preuve de paiement :
              <strong className="ml-2 text-2xl">
                {formatCountdown(secondsRemaining)}
              </strong>
            </p>

            <Link
              to={`/suivi/${guestDraft.trackingToken}`}
              className="mt-6 inline-block rounded-full bg-black px-6 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
            >
              Suivre ma réservation
            </Link>
          </section>
        )}
      </div>
    </section>
  );
}