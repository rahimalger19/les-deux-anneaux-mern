import { useEffect, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import {
  getEventTypes,
  getPacks,
} from "../../services/catalog.service";
import {
  createQuote,
  getMyQuotes,
  type Quote,
} from "../../services/quote.service";
import type { EventType, Pack } from "../../types/catalog.types";
import type { BookingSlot } from "../../types/booking.types";

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function QuotesPage() {
  const { language } = useLanguage();
  const locale = language === "fr-DZ" ? "fr" : language;

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const [eventTypeKey, setEventTypeKey] = useState("");
  const [packKey, setPackKey] = useState("");
  const [pricingMarket, setPricingMarket] = useState<
  "RESIDENT" | "DIASPORA"
>("RESIDENT");
  const [slot, setSlot] = useState<BookingSlot>("EVENING");
  const [womenGuests, setWomenGuests] = useState(0);
  const [menGuests, setMenGuests] = useState(0);
  const [customRequest, setCustomRequest] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    const [eventData, packData, quoteData] = await Promise.all([
      getEventTypes(),
      getPacks(),
      getMyQuotes(),
    ]);

    setEventTypes(eventData);
    setPacks(packData);
    setQuotes(quoteData);
  }

  useEffect(() => {
    loadData().catch(() => {
      setMessage("Impossible de charger les devis.");
    });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      await createQuote({
  eventTypeKey,
  packKey,
  slot,
  womenGuests,
  menGuests,
  customRequest,
  pricingMarket,
});

      setMessage(
        customRequest.trim()
          ? "Devis enregistré. Votre demande de pack personnalisé sera étudiée."
          : "Devis enregistré."
      );

      setCustomRequest("");
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d'enregistrer le devis."
      );
    }
  }

function getLocalizedName(name: { fr: string; en: string; ar: string }) {
  if (locale === "ar-DZ") {
    return name.ar;
  }

  return name[locale];
}

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Devis et brouillons</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-foreground/15 p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
  <p className="mb-3 text-sm font-semibold">Grille tarifaire</p>

  <div className="flex flex-wrap gap-3">
    <button
      type="button"
      onClick={() => setPricingMarket("RESIDENT")}
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
      onClick={() => setPricingMarket("DIASPORA")}
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
            <select
              required
              value={eventTypeKey}
              onChange={(event) => setEventTypeKey(event.target.value)}
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="">Choisir un événement</option>

              {eventTypes.map((eventType) => (
                <option key={eventType.key} value={eventType.key}>
                 {getLocalizedName(eventType.name)}
                </option>
              ))}
            </select>

            <select
              required
              value={packKey}
              onChange={(event) => setPackKey(event.target.value)}
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="">Choisir un pack</option>

              {packs.map((pack) => (
                <option key={pack.key} value={pack.key}>
                  {getLocalizedName(pack.name)}
                </option>
              ))}
            </select>

            <select
              value={slot}
              onChange={(event) =>
                setSlot(event.target.value as BookingSlot)
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="AFTERNOON">Après-midi</option>
              <option value="EVENING">Soir</option>
              <option value="NIGHT">Nuit</option>
              <option value="DAY">Journée</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                value={womenGuests}
                onChange={(event) =>
                  setWomenGuests(Number(event.target.value))
                }
                placeholder="Femmes"
                className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />

              <input
                type="number"
                min="0"
                value={menGuests}
                onChange={(event) =>
                  setMenGuests(Number(event.target.value))
                }
                placeholder="Hommes"
                className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </div>
          </div>

          <textarea
            value={customRequest}
            onChange={(event) => setCustomRequest(event.target.value)}
            maxLength={1500}
            placeholder="Demande de pack personnalisé ou remise exceptionnelle"
            className="mt-5 min-h-28 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          />

          <button
            type="submit"
            className="mt-5 rounded-xl bg-gold px-6 py-3 font-semibold text-black"
          >
            Enregistrer le devis
          </button>
        </form>

        {message && <p className="mt-6">{message}</p>}

        <section className="mt-10 space-y-4">
          {quotes.map((quote) => (
            <article
              key={quote.id}
              className="rounded-2xl border border-foreground/15 p-6"
            >
              <p className="font-semibold">
                {quote.eventTypeKey} - {quote.packKey}
              </p>

              <p className="mt-2 text-sm text-foreground/70">
                {quote.slot} · Femmes: {quote.womenGuests} · Hommes:{" "}
                {quote.menGuests}
              </p>

              <p className="mt-4 text-xl font-bold">
                {formatDZD(quote.totalDZD)}
              </p>

              <p className="mt-1 text-gold">
                Acompte : {formatDZD(quote.depositDZD)}
              </p>

              <p className="mt-3 text-sm font-semibold">
                Statut : {quote.status}
              </p>

<p className="mt-2 text-sm text-foreground/70">
  Grille :{" "}
  {quote.pricingMarket === "DIASPORA"
    ? "Diaspora / immigrants"
    : "Résidence DZ"}
</p>

              {quote.customRequest && (
                <p className="mt-3 text-sm text-foreground/70">
                  Demande : {quote.customRequest}
                </p>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}