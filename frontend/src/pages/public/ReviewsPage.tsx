import { useEffect, useState } from "react";
import {
  addReviewComment,
  getPublishedReviews,
  likeReview,
  type Review,
} from "../../services/community.service";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";

export default function ReviewsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [commentTexts, setCommentTexts] = useState<Record<string, string>>(
    {}
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  useEffect(() => {
    getPublishedReviews()
      .then(setReviews)
      .catch(() => setMessage(t("reviews.loadError")));
  }, [t]);

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
        setMessage(t("reviews.alreadyLiked"));
      }
    } catch {
      setMessage(t("reviews.likeError"));
    }
  }

  async function handleComment(reviewId: string) {
    const commentMessage = (commentTexts[reviewId] || "").trim();

    if (commentMessage.length < 2) {
      setMessage(t("reviews.commentMin"));
      return;
    }

    try {
      const result = await addReviewComment(reviewId, commentMessage);

      setReviews((current) =>
        current.map((review) =>
          review._id === reviewId
            ? {
                ...review,
                comments: [...review.comments, result.comment],
              }
            : review
        )
      );

      setCommentTexts((current) => ({
        ...current,
        [reviewId]: "",
      }));
      setMessage("");
    } catch {
      setMessage(t("reviews.commentError"));
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-serif text-4xl">{t("reviews.title")}</h1>

      {message ? <p className="mt-6 text-sm">{message}</p> : null}

      {reviews.length === 0 ? (
        <p className="mt-8 text-black/70">{t("reviews.empty")}</p>
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
                {review.verified ? ` · ${t("reviews.verified")}` : ""}
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
                        alt={t("reviews.photoAlt")}
                        className="h-28 w-28 rounded-xl object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : null}

              {review.officialReply ? (
                <section className="mt-5 rounded-xl bg-ivory p-4">
                  <strong>{t("reviews.officialReply")} :</strong>{" "}
                  {review.officialReply}
                </section>
              ) : null}

              {review.comments.length > 0 ? (
                <section className="mt-5 space-y-3">
                  <h3 className="font-semibold">
                    {t("reviews.comments")} ({review.comments.length})
                  </h3>

                  {review.comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="rounded-xl bg-black/5 p-4"
                    >
                      <strong>{comment.authorName}</strong>
                      <p className="mt-1 text-sm text-black/70">
                        {comment.message}
                      </p>
                    </div>
                  ))}
                </section>
              ) : null}

              {user ? (
                <div className="mt-5 flex gap-3">
                  <input
                    value={commentTexts[review._id] || ""}
                    onChange={(event) =>
                      setCommentTexts((current) => ({
                        ...current,
                        [review._id]: event.target.value,
                      }))
                    }
                    maxLength={1000}
                    placeholder={t("reviews.addComment")}
                    className="flex-1 rounded-xl border border-black/15 px-4 py-3"
                  />

                  <button
                    type="button"
                    onClick={() => void handleComment(review._id)}
                    className="rounded-xl bg-gold px-4 py-3 font-semibold text-black"
                  >
                    {t("reviews.publish")}
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                disabled={likedIds.has(review._id)}
                onClick={() => void handleLike(review._id)}
                aria-label={t("reviews.like")}
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
