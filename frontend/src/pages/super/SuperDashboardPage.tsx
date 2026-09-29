import { useEffect, useState } from "react";
import {
  getSuperDashboard,
  type SuperDashboard,
} from "../../services/super-dashboard.service";

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SuperDashboardPage() {
  const [dashboard, setDashboard] = useState<SuperDashboard | null>(null);
  const [message, setMessage] = useState("Chargement du pilotage...");

  useEffect(() => {
    getSuperDashboard()
      .then((data) => {
        setDashboard(data);
        setMessage("");
      })
      .catch((error: any) => {
        setMessage(
          error.response?.data?.message ||
            "Impossible de charger le pilotage."
        );
      });
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Pilotage</h1>

        {message && <p className="mt-8">{message}</p>}

        {dashboard && (
          <>
            <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-foreground/15 p-6">
                <p className="text-sm text-foreground/60">CA facturé DZD</p>
                <p className="mt-3 text-3xl font-bold text-gold">
                  {formatDZD(dashboard.revenue.totalDZD)}
                </p>
              </article>

              <article className="rounded-2xl border border-foreground/15 p-6">
                <p className="text-sm text-foreground/60">
                  Réservations facturées
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {dashboard.revenue.invoicedBookings}
                </p>
              </article>

              <article className="rounded-2xl border border-foreground/15 p-6">
                <p className="text-sm text-foreground/60">
                  Événements de nuit
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {dashboard.slotDistribution.night}
                </p>
              </article>

              <article className="rounded-2xl border border-foreground/15 p-6">
                <p className="text-sm text-foreground/60">
                  Événements de jour
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {dashboard.slotDistribution.day}
                </p>
              </article>
            </section>

            <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
              <h2 className="text-2xl font-bold">Funnel réservation en ligne</h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl bg-foreground/5 p-4">
                  <p className="text-sm text-foreground/60">Démarrées</p>
                  <p className="mt-2 text-2xl font-bold">
                    {dashboard.onlineFunnel.started}
                  </p>
                </div>

                <div className="rounded-xl bg-foreground/5 p-4">
                  <p className="text-sm text-foreground/60">OTP en attente</p>
                  <p className="mt-2 text-2xl font-bold">
                    {dashboard.onlineFunnel.otpPending}
                  </p>
                </div>

                <div className="rounded-xl bg-foreground/5 p-4">
                  <p className="text-sm text-foreground/60">Holds actifs</p>
                  <p className="mt-2 text-2xl font-bold">
                    {dashboard.onlineFunnel.held}
                  </p>
                </div>

                <div className="rounded-xl bg-foreground/5 p-4">
                  <p className="text-sm text-foreground/60">
                    Preuves en attente
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {dashboard.onlineFunnel.proofPending}
                  </p>
                </div>

                <div className="rounded-xl bg-foreground/5 p-4">
                  <p className="text-sm text-foreground/60">Facturées</p>
                  <p className="mt-2 text-2xl font-bold">
                    {dashboard.onlineFunnel.invoiced}
                  </p>
                </div>

                <div className="rounded-xl bg-foreground/5 p-4">
                  <p className="text-sm text-foreground/60">Terminées</p>
                  <p className="mt-2 text-2xl font-bold">
                    {dashboard.onlineFunnel.done}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
              <h2 className="text-2xl font-bold">Instagram</h2>

              <p className="mt-4 text-foreground/70">
                {dashboard.instagram.message}
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}