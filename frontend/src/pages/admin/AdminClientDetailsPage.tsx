import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAdminClientDetails,
  type AdminClientDetails,
} from "../../services/admin-client.service";

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminClientDetailsPage() {
  const { kind, id } = useParams();
  const [data, setData] = useState<AdminClientDetails | null>(null);
  const [message, setMessage] = useState("Chargement de la fiche client...");

  useEffect(() => {
    if (!id || (kind !== "USER" && kind !== "GUEST")) {
      setMessage("Client invalide.");
      return;
    }

    getAdminClientDetails(kind, id)
      .then((result) => {
        setData(result);
        setMessage("");
      })
      .catch((error: any) => {
        setMessage(
          error.response?.data?.message ||
            "Impossible de charger la fiche client."
        );
      });
  }, [kind, id]);

  if (!data) {
    return <main className="p-10">{message}</main>;
  }

  const { client, bookings } = data;

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <Link to="/admin/clients" className="text-sm underline">
          ← Fiches clients
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">{client.name}</h1>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-sm text-foreground/60">Type</p>
              <p className="mt-1 font-semibold">
                {client.kind === "USER" ? "Compte client" : "Guest OTP"}
              </p>
            </div>

            <div>
              <p className="text-sm text-foreground/60">Téléphone</p>
              <p className="mt-1 font-semibold">{client.phone || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-foreground/60">Email</p>
              <p className="mt-1 font-semibold">{client.email || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-foreground/60">Grille client</p>
              <p className="mt-1 font-semibold">
                {client.diaspora ? "Diaspora" : "Résidence DZ"}
              </p>
            </div>

            {client.kind === "USER" && (
              <>
                <div>
                  <p className="text-sm text-foreground/60">Langue</p>
                  <p className="mt-1 font-semibold">{client.language || "—"}</p>
                </div>

                <div>
                  <p className="text-sm text-foreground/60">Devise</p>
                  <p className="mt-1 font-semibold">{client.currency || "—"}</p>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Historique des réservations</h2>

          <div className="mt-5 space-y-4">
            {bookings.length === 0 ? (
              <p className="text-foreground/65">Aucune réservation.</p>
            ) : (
              bookings.map((booking) => (
                <Link
                  key={booking.id}
                  to={`/admin/reservations/${booking.id}`}
                  className="block rounded-2xl border border-foreground/15 p-6 transition hover:border-gold"
                >
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-foreground/60">Événement</p>
                      <p className="mt-1 font-semibold">
                        {booking.eventTypeKey}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-foreground/60">Date</p>
                      <p className="mt-1 font-semibold">
                        {booking.eventDate} · {booking.slot}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-foreground/60">Acompte</p>
                      <p className="mt-1 font-semibold">
                        {formatDZD(booking.depositDZD)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-foreground/60">Statut</p>
                      <p className="mt-1 font-semibold text-gold">
                        {booking.status}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-foreground/10 px-3 py-1">
                      {booking.pricingMarket === "DIASPORA"
                        ? "Diaspora"
                        : "Résidence DZ"}
                    </span>

                    {booking.hasGuestOtp && (
                      <span className="rounded-full bg-foreground/10 px-3 py-1">
                        Guest OTP
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
        <section className="mt-8">
  <h2 className="text-2xl font-bold">Historique des paiements</h2>

  <div className="mt-5 space-y-3">
    {data.payments.length === 0 ? (
      <p className="text-foreground/65">Aucun paiement.</p>
    ) : (
      data.payments.map((payment) => (
        <article
          key={payment.id}
          className="rounded-2xl border border-foreground/15 p-5"
        >
          <p className="font-semibold">
            {payment.method} · {formatDZD(payment.amountDZD)}
          </p>

          <p className="mt-1 text-sm text-foreground/70">
            {payment.status}
            {payment.reference ? ` · Référence ${payment.reference}` : ""}
          </p>

          {payment.rejectionReason ? (
            <p className="mt-3 text-sm text-red-700">
              Motif : {payment.rejectionReason}
            </p>
          ) : null}
        </article>
      ))
    )}
  </div>
</section>

<section className="mt-8">
  <h2 className="text-2xl font-bold">Historique des rendez-vous</h2>

  <div className="mt-5 space-y-3">
    {data.appointments.length === 0 ? (
      <p className="text-foreground/65">Aucun rendez-vous.</p>
    ) : (
      data.appointments.map((appointment) => (
        <article
          key={appointment.id}
          className="rounded-2xl border border-foreground/15 p-5"
        >
          <p className="font-semibold">
            {appointment.type === "VISIT"
              ? "Visite showroom"
              : "Visio diaspora"}
          </p>

          <p className="mt-1 text-sm text-foreground/70">
            {appointment.status}
            {appointment.appointmentSlot
              ? ` · ${appointment.appointmentSlot}`
              : appointment.requestedSlot
                ? ` · Souhaité : ${appointment.requestedSlot}`
                : ""}
          </p>

          {appointment.scheduledAt ? (
            <p className="mt-2 text-sm">
              {new Intl.DateTimeFormat("fr-DZ", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Africa/Algiers",
              }).format(new Date(appointment.scheduledAt))}
            </p>
          ) : null}
        </article>
      ))
    )}
  </div>
</section>
      </div>
    </main>
  );
}