import { useEffect, useState } from "react";
import {
  getSuperTracking,
  type TrackingData,
} from "../../services/super-tracking.service";

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function funnelLabel(type: string) {
  const labels: Record<string, string> = {
    PAGE_VIEW: "Pages vues",
    RESERVATION_ESTIMATE: "Estimations de réservation",
    BOOKING_DRAFT_CREATED: "Brouillons créés",
    OTP_VERIFIED: "OTP vérifiés",
  };

  return labels[type] || type;
}

export default function SuperTrackingPage() {
  const [data, setData] = useState<TrackingData | null>(null);
  const [message, setMessage] = useState("Chargement du tracking...");

  useEffect(() => {
    getSuperTracking()
      .then((result) => {
        setData(result);
        setMessage("");
      })
      .catch(() =>
        setMessage("Impossible de charger les données de tracking.")
      );
  }, []);

  if (!data) {
    return <main className="p-10">{message}</main>;
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Tracking et tunnel
        </h1>

        <p className="mt-4 text-foreground/70">
          Les IP sont volontairement masquées. Les données affichent le
          trafic, le tunnel de réservation et les origines de campagne.
        </p>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-xl font-bold">Tunnel de réservation</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {data.funnel.map((step) => (
              <article
                key={step.type}
                className="rounded-xl bg-foreground/5 p-4"
              >
                <p className="text-sm text-foreground/65">
                  {funnelLabel(step.type)}
                </p>

                <p className="mt-2 text-3xl font-bold">{step.count}</p>

                <p className="mt-2 text-sm text-foreground/65">
                  {step.conversionFromPrevious === null
                    ? "Point de départ"
                    : `${step.conversionFromPrevious}% de l’étape précédente`}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-foreground/15 p-6">
            <h2 className="text-xl font-bold">
              Invités et comptes clients
            </h2>

            <ul className="mt-4 space-y-3">
              {data.journeys.map((item) => (
                <li
                  key={item.journey}
                  className="flex justify-between border-b border-foreground/10 pb-2"
                >
                  <span>
                    {item.journey === "ACCOUNT"
                      ? "Compte connecté"
                      : "Invité"}
                  </span>
                  <strong>{item.count}</strong>
                </li>
              ))}

              {data.journeys.length === 0 ? (
                <li className="text-foreground/65">Aucune donnée.</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-2xl border border-foreground/15 p-6">
            <h2 className="text-xl font-bold">Appareils</h2>

            <ul className="mt-4 space-y-3">
              {data.devices.map((item) => (
                <li
                  key={item.device}
                  className="flex justify-between border-b border-foreground/10 pb-2"
                >
                  <span className="max-w-80 truncate">{item.device}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}

              {data.devices.length === 0 ? (
                <li className="text-foreground/65">Aucune donnée.</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-2xl border border-foreground/15 p-6">
            <h2 className="text-xl font-bold">Pays</h2>

            <ul className="mt-4 space-y-3">
              {data.countries.map((item) => (
                <li
                  key={item.country}
                  className="flex justify-between border-b border-foreground/10 pb-2"
                >
                  <span>{item.country}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}

              {data.countries.length === 0 ? (
                <li className="text-foreground/65">
                  Aucun en-tête pays fourni par le proxy.
                </li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-2xl border border-foreground/15 p-6">
            <h2 className="text-xl font-bold">IP masquées</h2>

            <ul className="mt-4 space-y-3">
              {data.ips.map((item) => (
                <li
                  key={item.ip}
                  className="border-b border-foreground/10 pb-2"
                >
                  <div className="flex justify-between gap-4">
                    <span>{item.ip}</span>
                    <strong>{item.count}</strong>
                  </div>

                  <p className="mt-1 text-xs text-foreground/60">
                    Dernière activité : {formatDate(item.lastSeenAt)}
                  </p>
                </li>
              ))}

              {data.ips.length === 0 ? (
                <li className="text-foreground/65">Aucune donnée.</li>
              ) : null}
            </ul>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-xl font-bold">Campagnes UTM</h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="border-b border-foreground/15">
                <tr>
                  <th className="px-3 py-3">Source</th>
                  <th className="px-3 py-3">Medium</th>
                  <th className="px-3 py-3">Campaign</th>
                  <th className="px-3 py-3">Événements</th>
                </tr>
              </thead>

              <tbody>
                {data.utm.map((item) => (
                  <tr
                    key={`${item.source}-${item.medium}-${item.campaign}`}
                    className="border-b border-foreground/10"
                  >
                    <td className="px-3 py-3">{item.source}</td>
                    <td className="px-3 py-3">{item.medium}</td>
                    <td className="px-3 py-3">{item.campaign}</td>
                    <td className="px-3 py-3 font-semibold">
                      {item.count}
                    </td>
                  </tr>
                ))}

                {data.utm.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-foreground/65"
                    >
                      Aucune campagne UTM détectée.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {message ? <p className="mt-6">{message}</p> : null}
      </div>
    </main>
  );
}