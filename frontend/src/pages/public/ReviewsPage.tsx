import { useEffect, useState } from "react";
import {
  getPublishedReviews,
  likeReview,
  type Review,
} from "../../services/community.service";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  useEffect(() => {
    getPublishedReviews()
      .then(setReviews)
      .catch(() => setMessage("Impossible de charger les avis."));
  }, []);

  async function handleLike(reviewId: string) {
    try {
      const result = await likeReview(reviewId);

      setReviews((current) =>
        current.map((review) =>
          review._id === reviewId
            ? { ...review, likeCount: result.likeCount }
            : review
        )
      );

      if (result.liked) {
        setLikedIds((current) => new Set(current).add(reviewId));
      } else {
        setMessage("Vous avez déjà aimé cet avis.");
      }
    } catch {
      setMessage("Impossible d’enregistrer votre like.");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-serif text-4xl">Avis clients</h1>

      {message ? <p className="mt-6 text-sm">{message}</p> : null}

      {reviews.length === 0 ? (
        <p className="mt-8 text-black/70">
          Les avis publiés apparaîtront ici.
        </p>
      ) : (
        <div className="mt-10 space-y-5">
          {reviews.map((review) => (
            <article
              key={review._id}
              className="rounded-2xl border border-black/10 bg-white p-6"
            >
              <p className="text-gold">{"★".repeat(review.rating)}</p>

              <h2 className="mt-3 font-semibold">
                {review.authorName}
                {review.verified ? " · Avis vérifié" : ""}
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-black/70">
                {review.message}
              </p>

              {review.photoUrls.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {review.photoUrls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={url}
                        alt="Photo envoyée avec l’avis"
                        className="h-28 w-28 rounded-xl object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : null}

              {review.officialReply ? (
                <section className="mt-5 rounded-xl bg-ivory p-4">
                  <strong>Les Deux Anneaux :</strong>{" "}
                  {review.officialReply}
                </section>
              ) : null}

              <button
                type="button"
                disabled={likedIds.has(review._id)}
                onClick={() => void handleLike(review._id)}
                className="mt-5 rounded-full border border-black/15 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                ♥ {review.likeCount}
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}