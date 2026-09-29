import { useEffect, useState } from "react";

import {
  getAdminContactMessages,
  updateAdminContactMessageStatus,
} from "../../services/admin-communication.service";

import type {
  AdminContactMessage,
  ContactMessageStatus,
} from "../../services/admin-communication.service";

const statusLabels: Record<ContactMessageStatus, string> = {
  NEW: "Nouveau",
  IN_PROGRESS: "En cours",
  REPLIED: "Répondu",
  CLOSED: "Fermé",
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  async function loadMessages() {
    try {
      setLoading(true);
      setMessages(await getAdminContactMessages());
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to load messages"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMessages();
  }, []);

  async function changeStatus(
    messageId: string,
    status: ContactMessageStatus
  ) {
    try {
      setFeedback("");
      await updateAdminContactMessageStatus(messageId, status);
      await loadMessages();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to update message"
      );
    }
  }

  if (loading) {
    return <main className="p-10">Chargement des messages…</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
        Administration
      </p>

      <h1 className="mt-3 font-serif text-4xl">Messages de contact</h1>

      <p className="mt-3 text-black/70">
        Tous les messages envoyés depuis la page Contact sont conservés ici.
      </p>

      {feedback ? (
        <p className="mt-5 rounded-lg bg-red-50 p-4 text-red-700">
          {feedback}
        </p>
      ) : null}

      <div className="mt-8 grid gap-5">
        {messages.length === 0 ? (
          <p className="rounded-xl border border-black/10 bg-white p-6">
            Aucun message pour le moment.
          </p>
        ) : null}

        {messages.map((message) => (
          <article
            key={message._id}
            className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div>
                <h2 className="text-xl font-semibold">{message.subject}</h2>

                <p className="mt-2 text-sm text-black/60">
                  De <strong>{message.name}</strong> · {message.email}
                  {message.phone ? ` · ${message.phone}` : ""}
                </p>

                <p className="mt-4 whitespace-pre-wrap leading-7">
                  {message.message}
                </p>

                <p className="mt-4 text-xs text-black/50">
                  Reçu le{" "}
                  {new Date(message.createdAt).toLocaleString("fr-DZ")}
                </p>
              </div>

              <div className="min-w-44">
                <label className="mb-2 block text-sm font-semibold">
                  Statut
                </label>

                <select
                  value={message.status}
                  onChange={(event) =>
                    void changeStatus(
                      message._id,
                      event.target.value as ContactMessageStatus
                    )
                  }
                  className="w-full rounded-lg border border-black/15 px-3 py-2"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}