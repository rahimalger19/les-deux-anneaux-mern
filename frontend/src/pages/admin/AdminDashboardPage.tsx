import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminDashboard,
  type AdminDashboard,
} from "../../services/admin-dashboard.service";

function formatDateTime(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [message, setMessage] = useState("Chargement du cockpit...");

 useEffect(() => {
  async function loadDashboard() {
    try {
      const data = await getAdminDashboard();
      setDashboard(data);
      setMessage("");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de charger le cockpit."
      );
    }
  }

  void loadDashboard();

  const refresh = window.setInterval(() => {
    void loadDashboard();
  }, 30_000);

  return () => window.clearInterval(refresh);
}, []);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Cockpit du jour</h1>

        {dashboard && (
          <p className="mt-3 text-foreground/70">
            Créneaux du {dashboard.period.today} au {dashboard.period.until}.
          </p>
        )}

        {message && <p className="mt-8">{message}</p>}

        {dashboard && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-foreground/15 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Créneaux J à J+7</h2>

                <Link
                  to="/admin/calendrier"
                  className="text-sm font-semibold text-gold underline"
                >
                  Calendrier
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {dashboard.upcomingSlots.length === 0 ? (
                  <p className="text-foreground/65">
                    Aucun créneau réservé sur cette période.
                  </p>
                ) : (
                  dashboard.upcomingSlots.map((booking) => (
                    <Link
                      key={booking.id}
                      to={`/admin/reservations/${booking.id}`}
                      className="block rounded-xl border border-foreground/15 p-4 hover:border-gold"
                    >
                      <p className="font-semibold">
                        {booking.eventDate} · {booking.slot}
                      </p>

                      <p className="mt-1 text-sm text-foreground/70">
                        {booking.eventTypeKey} · {booking.womenGuests} femmes ·{" "}
                        {booking.menGuests} hommes
                      </p>

                      <p className="mt-2 text-sm font-semibold text-gold">
                        {booking.status}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-foreground/15 p-6">
              <h2 className="text-2xl font-bold">Holds expirant sous 1 h</h2>

              <div className="mt-5 space-y-3">
                {dashboard.expiringHolds.length === 0 ? (
                  <p className="text-foreground/65">Aucun hold urgent.</p>
                ) : (
                  dashboard.expiringHolds.map((booking) => (
                    <Link
                      key={booking.id}
                      to={`/admin/reservations/${booking.id}`}
                      className="block rounded-xl border border-yellow-500/50 p-4"
                    >
                      <p className="font-semibold">
                        {booking.eventDate} · {booking.slot}
                      </p>

                      <p className="mt-1 text-sm">
                        {booking.eventTypeKey}
                      </p>

                      <p className="mt-2 text-sm text-yellow-700">
                        Expire : {formatDateTime(booking.holdExpiresAt)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-foreground/15 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Preuves en attente</h2>

                <Link
                  to="/admin/paiements"
                  className="text-sm font-semibold text-gold underline"
                >
                  Paiements
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {dashboard.pendingProofs.length === 0 ? (
                  <p className="text-foreground/65">
                    Aucune preuve en attente.
                  </p>
                ) : (
                  dashboard.pendingProofs.map((payment) => (
                    <Link
                      key={payment.id}
                      to="/admin/paiements"
                      className="block rounded-xl border border-foreground/15 p-4 hover:border-gold"
                    >
                      <p className="font-semibold">
                        {payment.booking?.eventTypeKey || "Réservation"} ·{" "}
                        {formatDZD(payment.amountDZD)}
                      </p>

                      <p className="mt-1 text-sm text-foreground/70">
                        {payment.method} ·{" "}
                        {payment.booking?.eventDate || "Date indisponible"} ·{" "}
                        {payment.booking?.slot || "Créneau indisponible"}
                      </p>

                      <p className="mt-2 text-sm text-gold">
                        {payment.proofFileName || "Fichier sans nom"}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-foreground/15 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Rendez-vous du jour</h2>

                <Link
                  to="/admin/rendez-vous"
                  className="text-sm font-semibold text-gold underline"
                >
                  Rendez-vous
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {dashboard.todayAppointments.length === 0 ? (
                  <p className="text-foreground/65">
                    Aucun rendez-vous aujourd’hui.
                  </p>
                ) : (
                  dashboard.todayAppointments.map((appointment) => (
                    <article
                      key={appointment.id}
                      className="rounded-xl border border-foreground/15 p-4"
                    >
                      <p className="font-semibold">
                        {formatDateTime(appointment.scheduledAt)}
                      </p>

                      <p className="mt-1 text-sm text-foreground/70">
                        {appointment.type === "VISIT"
                          ? "Visite showroom"
                          : "Visio diaspora"}{" "}
                        · {appointment.status}
                      </p>

                      {appointment.client && (
                        <p className="mt-2 text-sm">
                          {appointment.client.name} ·{" "}
                          {appointment.client.phone ||
                            appointment.client.email}
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}