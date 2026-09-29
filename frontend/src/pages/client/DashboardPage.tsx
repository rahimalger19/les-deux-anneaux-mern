import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  getMyBookings,
  type ClientBooking,
} from "../../services/client-booking.service";

type DashboardNotification = {
  id: string;
  title: string;
  description: string;
  to: string;
  action: string;
};

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function formatEventType(eventTypeKey: string) {
  return eventTypeKey.replace(/[-_]/g, " ");
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    getMyBookings()
      .then((data) => {
        if (active) {
          setBookings(data);
        }
      })
      .catch(() => {
        if (active) {
          setLoadError("Impossible de charger vos informations.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const nextBooking = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA");

    return [...bookings]
      .filter(
        (booking) =>
          booking.eventDate >= today &&
          !["CANCELLED", "EXPIRED", "DRAFT"].includes(booking.status)
      )
      .sort((left, right) => left.eventDate.localeCompare(right.eventDate))[0];
  }, [bookings]);

  // A proof submitted for validation is not shown as payable again.
  const totalDue = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "HELD")
        .reduce((total, booking) => total + booking.depositDZD, 0),
    [bookings]
  );

  const notifications = useMemo<DashboardNotification[]>(() => {
    const items: DashboardNotification[] = [];

    if (nextBooking) {
      items.push({
        id: `next-${nextBooking.id}`,
        title: "Prochain événement",
        description: `${formatEventType(nextBooking.eventTypeKey)} · ${formatDate(
          nextBooking.eventDate
        )}`,
        to: `/espace/reservations/${nextBooking.id}`,
        action: "Voir le dossier",
      });
    }

    bookings
      .filter((booking) => booking.status === "HELD")
      .forEach((booking) => {
        items.push({
          id: `payment-${booking.id}`,
          title: "Acompte à régler",
          description: `${formatDZD(
            booking.depositDZD
          )} est attendu pour votre réservation du ${formatDate(
            booking.eventDate
          )}.`,
          to: "/espace/paiements",
          action: "Régler",
        });
      });

    bookings
      .filter((booking) => booking.status === "PROOF_PENDING")
      .forEach((booking) => {
        items.push({
          id: `proof-${booking.id}`,
          title: "Preuve de paiement en attente",
          description: `Votre preuve de paiement du ${formatDate(
            booking.eventDate
          )} attend une validation.`,
          to: "/espace/preuves",
          action: "Voir la preuve",
        });
      });

    return items.slice(0, 3);
  }, [bookings, nextBooking]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
            Espace client
          </p>

          <h1 className="mt-3 font-serif text-4xl">
            Bonjour {user?.name || "Client"}
          </h1>
        </div>

        <Link
          to="/espace/nouvelle-reservation"
          className="rounded-full bg-black px-5 py-3 font-semibold text-ivory"
        >
          Réserver
        </Link>
      </div>

      {loadError ? (
        <p className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">
          {loadError}
        </p>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-black p-7 text-ivory">
          <p className="text-sm uppercase tracking-[0.2em] text-gold">
            Prochain événement
          </p>

          {loading ? (
            <p className="mt-4 text-ivory/75">Chargement…</p>
          ) : nextBooking ? (
            <>
              <h2 className="mt-4 font-serif text-3xl">
                {formatEventType(nextBooking.eventTypeKey)}
              </h2>

              <p className="mt-3 text-ivory/75">
                {formatDate(nextBooking.eventDate)}
              </p>

              <Link
                to={`/espace/reservations/${nextBooking.id}`}
                className="mt-6 inline-block rounded-full bg-gold px-5 py-3 font-semibold text-black"
              >
                Voir le dossier
              </Link>
            </>
          ) : (
            <>
              <p className="mt-4 text-ivory/75">
                Aucun événement à venir.
              </p>

              <Link
                to="/espace/nouvelle-reservation"
                className="mt-6 inline-block rounded-full bg-gold px-5 py-3 font-semibold text-black"
              >
                Réserver maintenant
              </Link>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-7">
          <p className="text-sm uppercase tracking-[0.2em] text-gold">
            Solde dû
          </p>

          <p className="mt-4 font-serif text-4xl">
            {loading ? "…" : formatDZD(totalDue)}
          </p>

          <p className="mt-3 text-sm text-black/65">
            Acomptes des réservations en attente de paiement.
          </p>

          <Link
            to="/espace/paiements"
            className="mt-6 inline-block rounded-full border border-black/20 px-5 py-3 font-semibold"
          >
            Voir mes paiements
          </Link>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-3xl">Actions rapides</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <Link
            to="/espace/nouvelle-reservation"
            className="rounded-2xl border border-black/10 bg-white p-6 hover:border-gold"
          >
            <h3 className="font-serif text-2xl">Réserver</h3>
            <p className="mt-3 text-sm text-black/65">
              Créer une nouvelle réservation.
            </p>
          </Link>

          <Link
            to="/espace/reservations"
            className="rounded-2xl border border-black/10 bg-white p-6 hover:border-gold"
          >
            <h3 className="font-serif text-2xl">Mes réservations</h3>
            <p className="mt-3 text-sm text-black/65">
              Suivre mes dossiers événement.
            </p>
          </Link>

          <Link
            to="/espace/documents"
            className="rounded-2xl border border-black/10 bg-white p-6 hover:border-gold"
          >
            <h3 className="font-serif text-2xl">Mes documents</h3>
            <p className="mt-3 text-sm text-black/65">
              Ouvrir mes pro formas et factures.
            </p>
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl">Notifications</h2>

          <Link
            to="/espace/notifications"
            className="text-sm font-semibold underline"
          >
            Voir toutes
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-black/65">Chargement…</p>
        ) : notifications.length ? (
          <div className="mt-5 grid gap-4">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-black/5 p-4"
              >
                <div>
                  <h3 className="font-semibold">{notification.title}</h3>
                  <p className="mt-1 text-sm text-black/65">
                    {notification.description}
                  </p>
                </div>

                <Link
                  to={notification.to}
                  className="rounded-full border border-black/20 px-4 py-2 text-sm font-semibold"
                >
                  {notification.action}
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-black/65">
            Vous n’avez aucune notification pour le moment.
          </p>
        )}
      </section>
    </main>
  );
}