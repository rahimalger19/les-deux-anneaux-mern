import { useEffect, useState } from "react";
import {
  getAdminReviews,
  updateAdminReview,
  type AdminReview,
} from "../../services/admin-review.service";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [status, setStatus] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Chargement des avis...");
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadReviews() {
    try {
      const data = await getAdminReviews(status || undefined);

      setReviews(data);
      setReplies(
        Object.fromEntries(
          data.map((review) => [review.id, review.officialReply])
        )
      );
      setMessage(
        data.length === 0
          ? "Aucun avis ne correspond à ce filtre."
          : ""
      );
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Impossible de charger les avis."
      );
    }
  }

  useEffect(() => {
    void loadReviews();
  }, [status]);

  async function handleStatus(
    reviewId: string,
    nextStatus: "PENDING" | "PUBLISHED" | "HIDDEN"
  ) {
    try {
      setProcessingId(reviewId);

      const result = await updateAdminReview(reviewId, {
        status: nextStatus,
      });

      setMessage(result.message);
      await loadReviews();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de mettre à jour l’avis."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReply(reviewId: string) {
    try {
      setProcessingId(reviewId);

      const result = await updateAdminReview(reviewId, {
        officialReply: replies[reviewId] || "",
      });

      setMessage(result.message);
      await loadReviews();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d’enregistrer la réponse."
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

        <h1 className="mt-2 text-4xl font-bold">Modération des avis</h1>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-8 rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="PUBLISHED">Publié</option>
          <option value="HIDDEN">Masqué</option>
        </select>

        {message && <p className="mt-6">{message}</p>}

        <section className="mt-8 space-y-5">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-foreground/15 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-gold">
                    {"★".repeat(review.rating)}
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    {review.authorName}
                    {review.verified ? " · Avis vérifié" : ""}
                  </h2>

                  <p className="mt-1 text-sm text-foreground/65">
                    {formatDate(review.createdAt)} · ♥ {review.likeCount} ·{" "}
                    {review.commentCount} commentaire(s)
                  </p>
                </div>

                <p className="rounded-full bg-foreground/10 px-3 py-1 text-sm font-semibold">
                  {review.status}
                </p>
              </div>

              <p className="mt-5 whitespace-pre-wrap">{review.message}</p>

              {review.photoUrls.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {review.photoUrls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={url}
                        alt="Photo envoyée avec l’avis"
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={processingId === review.id}
                  onClick={() => void handleStatus(review.id, "PUBLISHED")}
                  className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Publier
                </button>

                <button
                  type="button"
                  disabled={processingId === review.id}
                  onClick={() => void handleStatus(review.id, "HIDDEN")}
                  className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Masquer
                </button>

                <button
                  type="button"
                  disabled={processingId === review.id}
                  onClick={() => void handleStatus(review.id, "PENDING")}
                  className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Remettre en attente
                </button>
              </div>

              <label className="mt-6 block">
                <span className="text-sm font-semibold">
                  Réponse officielle
                </span>

                <textarea
                  value={replies[review.id] || ""}
                  maxLength={2000}
                  onChange={(event) =>
                    setReplies((current) => ({
                      ...current,
                      [review.id]: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-28 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                />
              </label>

              <button
                type="button"
                disabled={processingId === review.id}
                onClick={() => void handleReply(review.id)}
                className="mt-4 rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
              >
                Enregistrer la réponse
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}