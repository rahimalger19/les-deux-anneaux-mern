import { useEffect, useState } from "react";
import {
  getAdminContactMessages,
  replyToAdminContactMessage,
  updateAdminContactMessage,
  type AdminContactMessage,
  type ContactAgent,
} from "../../services/admin-contact.service";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [agents, setAgents] = useState<ContactAgent[]>([]);
  const [statusFilter, setStatusFilter] = useState<
  "" | "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED"
>("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [requestTypeFilter, setRequestTypeFilter] = useState<
  "" | "GENERAL" | "APPOINTMENT"
>("");
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Chargement des messages...");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function loadMessages() {
    try {
      const data = await getAdminContactMessages({
        status: statusFilter || undefined,
        assignedTo: assignedFilter || undefined,
        requestType: requestTypeFilter || undefined,
        page,
        limit: 20,
      });

      setMessages(data.messages);
      setAgents(data.agents);
      setTotalPages(data.pagination.totalPages);
      setMessage(
        data.messages.length === 0
          ? "Aucun message ne correspond aux filtres."
          : ""
      );
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de charger les messages."
      );
    }
  }

  useEffect(() => {
  setPage(1);
}, [statusFilter, assignedFilter, requestTypeFilter]);

useEffect(() => {
  void loadMessages();
}, [statusFilter, assignedFilter, requestTypeFilter, page]);

  async function handleUpdate(
    contact: AdminContactMessage,
    data: {
      status?: "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED";
      assignedTo?: string;
    }
  ) {
    try {
      setProcessingId(contact.id);

      const result = await updateAdminContactMessage(contact.id, data);

      setMessage(result.message);
      await loadMessages();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de mettre à jour le message."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReply(contact: AdminContactMessage) {
    const replyText = draftReplies[contact.id]?.trim();

    if (!replyText) {
      setMessage("Saisissez une réponse avant l’envoi.");
      return;
    }

    try {
      setProcessingId(contact.id);

      const result = await replyToAdminContactMessage(
        contact.id,
        replyText
      );

      setDraftReplies((current) => ({
        ...current,
        [contact.id]: "",
      }));

      setMessage(result.message);
      await loadMessages();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d'envoyer la réponse."
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Messages Contact</h1>

        <p className="mt-3 text-foreground/70">
          Toutes les soumissions du formulaire Contact sont enregistrées ici.
        </p>

        <section className="mt-8 flex flex-wrap gap-4 rounded-2xl border border-foreground/15 p-6">
          <select
            value={statusFilter}
            onChange={(event) =>
  setStatusFilter(
    event.target.value as
      | ""
      | "NEW"
      | "IN_PROGRESS"
      | "RESOLVED"
      | "ARCHIVED"
  )
}
            className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          >
            <option value="">Tous les statuts</option>
            <option value="NEW">Nouveau</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="RESOLVED">Résolu</option>
            <option value="ARCHIVED">Archivé</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(event) => setAssignedFilter(event.target.value)}
            className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          >
            <option value="">Tous les agents</option>
            <option value="unassigned">Non attribué</option>

            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} · {agent.role}
              </option>
            ))}
          </select>

          <select
  value={requestTypeFilter}
  onChange={(event) =>
  setRequestTypeFilter(
    event.target.value as "" | "GENERAL" | "APPOINTMENT"
  )
}
  className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
>
  <option value="">Toutes les demandes</option>
  <option value="GENERAL">Messages généraux</option>
  <option value="APPOINTMENT">Demandes de rendez-vous</option>
</select>
        </section>

        {message && <p className="mt-6">{message}</p>}

        <section className="mt-8 space-y-5">
          {messages.map((contact) => (
            <article
              key={contact.id}
              className="rounded-2xl border border-foreground/15 p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="font-semibold">{contact.name}</p>

                  <p className="mt-1 text-sm text-foreground/70">
                    {contact.email} · {contact.phone}
                  </p>

                  <p className="mt-1 text-sm text-foreground/70">
                    Langue : {contact.language} · Rappel :{" "}
                    {contact.callbackSlot}
                  </p>
                  {contact.requestType === "APPOINTMENT" ? (
  <p className="mt-1 text-sm font-semibold text-gold">
    Rendez-vous :{" "}
    {contact.requestedAppointmentType === "VIDEO"
      ? "Visio diaspora"
      : "Visite showroom"}{" "}
    · {contact.requestedAppointmentSlot || "Créneau non précisé"}
  </p>
) : null}
                </div>

                <div>
                  <p className="text-sm text-foreground/60">Reçu le</p>
                  <p className="font-semibold">
                    {formatDate(contact.createdAt)}
                  </p>

                  <p className="mt-1 text-sm text-foreground/70">
                    Source : {contact.source}
                  </p>
                </div>
              </div>

              <h2 className="mt-5 text-xl font-bold">{contact.subject}</h2>

              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-foreground/5 p-4">
                {contact.message}
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-semibold">Statut</span>

                  <select
                    value={contact.status}
                    disabled={processingId === contact.id}
                    onChange={(event) =>
                      void handleUpdate(contact, {
                        status: event.target.value as
                          | "NEW"
                          | "IN_PROGRESS"
                          | "RESOLVED"
                          | "ARCHIVED",
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                  >
                    <option value="NEW">Nouveau</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="RESOLVED">Résolu</option>
                    <option value="ARCHIVED">Archivé</option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Agent assigné
                  </span>

                  <select
                    value={contact.assignedTo?.id || ""}
                    disabled={processingId === contact.id}
                    onChange={(event) =>
                      void handleUpdate(contact, {
                        assignedTo: event.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                  >
                    <option value="">Non attribué</option>

                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} · {agent.role}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {contact.replyText ? (
                <section className="mt-6 rounded-xl border border-gold/50 p-4">
                  <p className="text-sm font-semibold text-gold">
                    Réponse envoyée
                  </p>

                  <p className="mt-2 whitespace-pre-wrap">
                    {contact.replyText}
                  </p>

                  {contact.repliedAt && (
                    <p className="mt-2 text-sm text-foreground/65">
                      {formatDate(contact.repliedAt)}
                      {contact.repliedBy
                        ? ` · ${contact.repliedBy.name}`
                        : ""}
                    </p>
                  )}
                </section>
              ) : (
                <section className="mt-6">
                  <label className="block text-sm font-semibold">
                    Réponse email
                  </label>

                  <textarea
                    value={draftReplies[contact.id] || ""}
                    maxLength={3000}
                    onChange={(event) =>
                      setDraftReplies((current) => ({
                        ...current,
                        [contact.id]: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-32 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                    placeholder="Votre réponse au client"
                  />

                  <button
                    type="button"
                    disabled={processingId === contact.id}
                    onClick={() => void handleReply(contact)}
                    className="mt-4 rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
                  >
                    Envoyer la réponse SMTP
                  </button>
                </section>
              )}
            </article>
          ))}
        </section>
        {totalPages > 1 ? (
  <div className="mt-8 flex items-center justify-between gap-4">
    <button
      type="button"
      disabled={page === 1}
      onClick={() => setPage((current) => current - 1)}
      className="rounded-xl border border-foreground/20 px-5 py-3 font-semibold disabled:opacity-50"
    >
      Précédent
    </button>

    <p className="text-sm text-foreground/70">
      Page {page} sur {totalPages}
    </p>

    <button
      type="button"
      disabled={page === totalPages}
      onClick={() => setPage((current) => current + 1)}
      className="rounded-xl border border-foreground/20 px-5 py-3 font-semibold disabled:opacity-50"
    >
      Suivant
    </button>
  </div>
) : null}
      </div>
    </main>
  );
}