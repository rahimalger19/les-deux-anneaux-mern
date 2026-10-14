import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  createSuperNewsletterCampaign,
  exportSuperNewsletterSubscribers,
  getSuperNewsletter,
  sendSuperNewsletterCampaign,
  type NewsletterCampaign,
  type NewsletterSegment,
  type NewsletterSubscriber,
} from "../../services/super-newsletter.service";

const segments: Array<{
  value: NewsletterSegment;
  label: string;
}> = [
  { value: "ALL", label: "Tous les abonnés" },
  { value: "fr-DZ", label: "Français" },
  { value: "ar-DZ", label: "العربية" },
  { value: "en", label: "English" },
];

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SuperNewsletterPage() {
  const [segment, setSegment] =
    useState<NewsletterSegment>("ALL");

  const [subscribers, setSubscribers] = useState<
    NewsletterSubscriber[]
  >([]);

  const [campaigns, setCampaigns] = useState<
    NewsletterCampaign[]
  >([]);

  const [confirmedCount, setConfirmedCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function loadData() {
    try {
      const data = await getSuperNewsletter(segment, page);

      setSubscribers(data.subscribers);
      setCampaigns(data.campaigns);
      setConfirmedCount(data.summary.confirmedCount);
      setSubscriberCount(data.summary.subscriberCount);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setMessage("Impossible de charger la newsletter.");
    }
  }

  useEffect(() => {
  setPage(1);
}, [segment]);

useEffect(() => {
  void loadData();
}, [segment, page]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();

    try {
      setCreating(true);

      await createSuperNewsletterCampaign({
        subject,
        html,
        segment,
      });

      setSubject("");
      setHtml("");
      setMessage("Brouillon créé.");
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de créer la campagne."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleSend(campaign: NewsletterCampaign) {
    if (
      !window.confirm(
        `Envoyer cette campagne à ${confirmedCount} abonné(s) confirmé(s) du segment sélectionné ?`
      )
    ) {
      return;
    }

    try {
      setSendingId(campaign.id);

      const result = await sendSuperNewsletterCampaign(campaign.id);

      setMessage(
        result.failedCount > 0
          ? `${result.sentCount} e-mails envoyés, ${result.failedCount} échec(s).`
          : "Campagne envoyée."
      );

      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d’envoyer la campagne."
      );
    } finally {
      setSendingId(null);
    }
  }

  async function handleExport() {
    try {
      setExporting(true);

      const blob = await exportSuperNewsletterSubscribers(segment);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `newsletter-${segment}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMessage("Export CSV téléchargé.");
    } catch {
      setMessage("Impossible d’exporter les abonnés.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Newsletter et campagnes
        </h1>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <label>
            <span className="text-sm font-semibold">Segment</span>

            <select
              value={segment}
              onChange={(event) =>
                setSegment(event.target.value as NewsletterSegment)
              }
              className="mt-2 rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              {segments.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExport()}
            className="rounded-xl border border-foreground/20 px-5 py-3 font-semibold disabled:opacity-50"
          >
            {exporting ? "Export..." : "Exporter CSV"}
          </button>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-foreground/15 p-5">
            <p className="text-sm text-foreground/65">
              Abonnés du segment
            </p>
            <p className="mt-2 text-3xl font-bold">{subscriberCount}</p>
          </article>

          <article className="rounded-2xl border border-foreground/15 p-5">
            <p className="text-sm text-foreground/65">
              Confirmés et destinataires
            </p>
            <p className="mt-2 text-3xl font-bold">{confirmedCount}</p>
          </article>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Abonnés</h2>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-foreground/15">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="bg-foreground/5">
                <tr>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Langue</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Inscription</th>
                </tr>
              </thead>

              <tbody>
                {subscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="border-t border-foreground/10"
                  >
                    <td className="px-4 py-3">{subscriber.email}</td>
                    <td className="px-4 py-3">{subscriber.phone}</td>
                    <td className="px-4 py-3">
                      {subscriber.language}
                    </td>
                    <td className="px-4 py-3">
                      {subscriber.status}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(subscriber.createdAt)}
                    </td>
                  </tr>
                ))}

                {subscribers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-foreground/65"
                    >
                      Aucun abonné dans ce segment.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
  <div className="mt-6 flex items-center justify-between gap-4">
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
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">
            Créer une campagne segmentée
          </h2>

          <form
            onSubmit={handleCreate}
            className="mt-5 rounded-2xl border border-foreground/15 p-6"
          >
            <p className="text-sm text-foreground/65">
              Cette campagne sera envoyée au segment :{" "}
              <strong>
                {
                  segments.find((item) => item.value === segment)
                    ?.label
                }
              </strong>
              .
            </p>

            <input
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Objet de la campagne"
              className="mt-5 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <textarea
              required
              value={html}
              onChange={(event) => setHtml(event.target.value)}
              placeholder="Corps HTML de la campagne"
              className="mt-5 min-h-64 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3 font-mono text-sm"
            />

            <button
              type="submit"
              disabled={creating}
              className="mt-5 rounded-xl bg-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
            >
              {creating ? "Création..." : "Créer le brouillon"}
            </button>
          </form>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">Historique des campagnes</h2>

          {campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="rounded-2xl border border-foreground/15 p-6"
            >
              <p className="font-semibold">{campaign.subject}</p>

              <p className="mt-2 text-sm text-foreground/65">
                Segment : {campaign.segment} · Statut : {campaign.status}
              </p>

              <p className="mt-1 text-sm text-foreground/65">
                Destinataires : {campaign.recipientCount} · Envoyés :{" "}
                {campaign.sentCount} · Échecs : {campaign.failedCount}
              </p>

              {["DRAFT", "PARTIAL_FAILURE"].includes(
                campaign.status
              ) ? (
                <button
                  type="button"
                  onClick={() => void handleSend(campaign)}
                  disabled={sendingId === campaign.id}
                  className="mt-5 rounded-xl bg-black px-5 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
                >
                  {sendingId === campaign.id
                    ? "Envoi..."
                    : campaign.status === "PARTIAL_FAILURE"
                      ? "Réessayer les échecs"
                      : "Envoyer la campagne"}
                </button>
              ) : null}
            </article>
          ))}
        </section>

        {message ? <p className="mt-6">{message}</p> : null}
      </div>
    </main>
  );
}