import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings } from "../../services/client-booking.service";

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
  totalDZD: number;
  depositDZD: number;
  status: BookingStatus;
  holdExpiresAt?: string;
};

const statuses: Array<{ value: "" | BookingStatus; label: string }> = [
  { value: "", label: "Tous les statuts" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "PRICED", label: "Estimé" },
  { value: "OTP_PENDING", label: "OTP en attente" },
  { value: "HELD", label: "Créneau bloqué" },
  { value: "PROOF_PENDING", label: "Preuve en attente" },
  { value: "PAID", label: "Paiement validé" },
  { value: "INVOICED", label: "Facturé" },
  { value: "DONE", label: "Terminé" },
  { value: "CANCELLED", label: "Annulé" },
  { value: "EXPIRED", label: "Expiré" },
];

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getHoldSeconds(holdExpiresAt?: string) {
  if (!holdExpiresAt) return 0;

  return Math.max(
    0,
    Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000)
  );
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(
    2,
    "0"
  )}`;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | BookingStatus>("");
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch((caughtError) =>
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger les réservations."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus = !status || booking.status === status;

      const matchesSearch =
        !term ||
        booking.id.toLowerCase().includes(term) ||
        booking.eventDate.toLowerCase().includes(term) ||
        booking.eventTypeKey.toLowerCase().includes(term) ||
        (booking.packKey || "").toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, status]);

  if (loading) {
    return <main className="p-10">Chargement des réservations…</main>;
  }

  return (
    <main>
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
        Espace client
      </p>

      <h1 className="mt-3 font-serif text-4xl">Mes réservations</h1>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par date, événement, pack ou identifiant"
          className="rounded-xl border border-black/15 bg-white px-4 py-3"
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as "" | BookingStatus)
          }
          className="rounded-xl border border-black/15 bg-white px-4 py-3"
        >
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
      ) : null}

      {filteredBookings.length === 0 ? (
        <p className="mt-8 rounded-xl border border-black/10 bg-white p-6">
          Aucune réservation ne correspond à votre recherche.
        </p>
      ) : (
        <div className="mt-8 grid gap-5">
          {filteredBookings.map((booking) => {
            const holdSeconds =
              booking.status === "HELD"
                ? getHoldSeconds(booking.holdExpiresAt)
                : 0;

            return (
              <article
                key={booking.id}
                className="rounded-2xl border border-black/10 bg-white p-6"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row">
                  <div>
                    <p className="text-sm font-semibold text-gold">
                      {booking.status}
                    </p>

                    <h2 className="mt-2 font-serif text-2xl">
                      {booking.eventTypeKey}
                    </h2>

                    <p className="mt-3 text-black/70">
                      {booking.eventDate} · {booking.slot}
                    </p>

                    <p className="mt-2 text-sm text-black/60">
                      Pack : {booking.packKey || "Aucun"}
                    </p>

                    <p className="mt-3 font-semibold">
                      Acompte : {formatDZD(booking.depositDZD)}
                    </p>

                    {booking.status === "HELD" ? (
                      <p className="mt-4 rounded-lg bg-yellow-100 px-4 py-3 text-sm text-yellow-900">
                        Temps restant du hold :{" "}
                        <strong>{formatCountdown(holdSeconds)}</strong>
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link
                      to={`/espace/reservations/${booking.id}`}
                      className="rounded-full bg-black px-5 py-3 text-center font-semibold text-ivory"
                    >
                      Voir le dossier
                    </Link>

                    <Link
                      to="/espace/nouvelle-reservation"
                      className="rounded-full border border-black/20 px-5 py-3 text-center font-semibold"
                    >
                      Nouvelle réservation
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Makes the timer update visible without changing booking data. */}
      <span className="hidden">{now}</span>
    </main>
  );
}