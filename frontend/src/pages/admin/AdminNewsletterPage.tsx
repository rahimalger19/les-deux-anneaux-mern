import { useEffect, useState } from "react";

import {
  getNewsletterSubscribers,
} from "../../services/admin-communication.service";

import type {
  NewsletterSubscriber,
} from "../../services/admin-communication.service";

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubscribers() {
      try {
        setSubscribers(await getNewsletterSubscribers());
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load subscribers"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSubscribers();
  }, []);

  if (loading) {
    return <main className="p-10">Chargement des abonnés…</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
        Administration
      </p>

      <h1 className="mt-3 font-serif text-4xl">Newsletter</h1>

      <p className="mt-3 text-black/70">
        {subscribers.filter((subscriber) => subscriber.subscribed).length}{" "}
        abonnés actifs.
      </p>

      {error ? (
        <p className="mt-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
      ) : null}

      <div className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-black text-ivory">
            <tr>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Statut</th>
              <th className="px-5 py-4">Date d’inscription</th>
            </tr>
          </thead>

          <tbody>
            {subscribers.map((subscriber) => (
              <tr key={subscriber._id} className="border-t border-black/10">
                <td className="px-5 py-4">{subscriber.email}</td>

                <td className="px-5 py-4">
                  <span
                    className={
                      subscriber.subscribed
                        ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800"
                        : "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800"
                    }
                  >
                    {subscriber.subscribed ? "Actif" : "Désabonné"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  {new Date(
                    subscriber.subscribedAt || subscriber.createdAt
                  ).toLocaleString("fr-DZ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}