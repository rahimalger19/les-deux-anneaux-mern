import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyBookingDetails } from "../../services/client-booking.service";

type BookingStatus =
  | "DRAFT"
  | "PRICED"
  | "OTP_PENDING"
  | "HELD"
  | "PROOF_PENDING"
  | "PAID"
  | "INVOICED"
  | "DONE"
  | "CANCELLED"
  | "EXPIRED";

type Booking = {
  id: string;
  eventDate: string;
  slot: string;
  eventTypeKey: string;
  packKey?: string;
  optionKeys: string[];
  pricingMarket: "RESIDENT" | "DIASPORA";
  womenGuests: number;
  menGuests: number;
  totalDZD: number;
  depositDZD: number;
  currency: string;
  status: BookingStatus;
  holdExpiresAt?: string;
  createdAt: string;
  updatedAt?: string;
};

const timeline: BookingStatus[] = [
  "DRAFT",
  "PRICED",
  "OTP_PENDING",
  "HELD",
  "PROOF_PENDING",
  "PAID",
  "INVOICED",
  "DONE",
];

const labels: Record<BookingStatus, string> = {
  DRAFT: "Brouillon",
  PRICED: "Devis calculé",
  OTP_PENDING: "OTP en attente",
  HELD: "Créneau bloqué",
  PROOF_PENDING: "Preuve de paiement en attente",
  PAID: "Paiement validé",
  INVOICED: "Facture émise",
  DONE: "Événement terminé",
  CANCELLED: "Réservation annulée",
  EXPIRED: "Hold expiré",
};

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BookingDetailsPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    getMyBookingDetails(id)
      .then(setBooking)
      .catch((caughtError) =>
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger la réservation."
        )
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <main className="p-10">Chargement du dossier…</main>;
  }

  if (error || !booking) {
    return (
      <main className="p-10">
        <p className="text-red-700">
          {error || "Réservation introuvable."}
        </p>
      </main>
    );
  }

  const activeTimelineIndex = timeline.indexOf(booking.status);

  return (
    <main>
      <Link to="/espace/reservations" className="text-sm underline">
        ← Mes réservations
      </Link>

      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-gold">
        Dossier événement
      </p>

      <h1 className="mt-3 font-serif text-4xl">
        {booking.eventTypeKey}
      </h1>

      <p className="mt-4 text-black/70">
        {booking.eventDate} · {booking.slot}
      </p>

      <section className="mt-10 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Suivi de la réservation</h2>

        {booking.status === "CANCELLED" || booking.status === "EXPIRED" ? (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
            {labels[booking.status]}
          </p>
        ) : (
          <ol className="mt-7 grid gap-3 md:grid-cols-4">
            {timeline.map((status, index) => {
              const completed = activeTimelineIndex >= index;

              return (
                <li
                  key={status}
                  className={
                    completed
                      ? "rounded-xl bg-gold p-4 text-black"
                      : "rounded-xl border border-black/10 p-4 text-black/45"
                  }
                >
                  <p className="text-sm font-semibold">{index + 1}</p>
                  <p className="mt-1 text-sm">{labels[status]}</p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="font-serif text-2xl">Événement</h2>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-black/60">Femmes</dt>
              <dd className="mt-1 font-semibold">{booking.womenGuests}</dd>
            </div>

            <div>
              <dt className="text-sm text-black/60">Hommes</dt>
              <dd className="mt-1 font-semibold">{booking.menGuests}</dd>
            </div>

            <div>
              <dt className="text-sm text-black/60">Pack</dt>
              <dd className="mt-1 font-semibold">
                {booking.packKey || "Aucun"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-black/60">Grille tarifaire</dt>
              <dd className="mt-1 font-semibold">
                {booking.pricingMarket === "DIASPORA"
                  ? "Diaspora"
                  : "Résidence DZ"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="font-serif text-2xl">Montants</h2>

          <dl className="mt-5 grid gap-4">
            <div className="flex justify-between gap-4">
              <dt className="text-black/60">Total</dt>
              <dd className="font-semibold">{formatDZD(booking.totalDZD)}</dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-black/60">Acompte</dt>
              <dd className="font-semibold">
                {formatDZD(booking.depositDZD)}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-black/60">Statut</dt>
              <dd className="font-semibold">{labels[booking.status]}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Options</h2>

        {booking.optionKeys.length === 0 ? (
          <p className="mt-4 text-black/65">Aucune option sélectionnée.</p>
        ) : (
          <ul className="mt-4 list-disc space-y-2 pl-6">
            {booking.optionKeys.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="font-serif text-2xl">Messages</h2>

        <p className="mt-4 text-black/65">
          Aucun message interne n’est encore disponible pour ce dossier.
        </p>
      </section>
    </main>
  );
}