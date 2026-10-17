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
  const backendUrl = (import.meta.env.VITE_API_URL || "")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

function getReviewPhotoUrl(photoUrl: string) {
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }

  return `${backendUrl}${photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`}`;
}
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
  <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 sm:py-16">
    <div className="mx-auto max-w-4xl">
      {/* Page heading */}
      <div className="mb-10 text-center sm:mb-14">
        <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          Les Deux Anneaux
        </span>

        <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
          {t("reviews.title")}
        </h1>

        <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-gold" />

        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-foreground/60 sm:text-base">
          {t("reviews.empty") && reviews.length === 0
            ? t("reviews.empty")
            : ""}
        </p>
      </div>

      {/* Status message */}
      {message ? (
        <div
          role="status"
          className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 text-sm leading-6"
        >
          {message}
        </div>
      ) : null}

      {/* Empty state */}
      {reviews.length === 0 ? (
        <div className="rounded-3xl border border-foreground/10 bg-surface px-6 py-14 text-center shadow-sm sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-3xl text-gold">
            ★
          </div>

          <h2 className="mt-5 font-serif text-2xl">
            {t("reviews.title")}
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-foreground/60">
            {t("reviews.empty")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <article
              key={review._id}
              className="group overflow-hidden rounded-2xl border border-foreground/10 bg-surface shadow-sm transition duration-300 hover:border-gold/40 hover:shadow-lg sm:rounded-3xl"
            >
              <div className="p-5 sm:p-7 md:p-8">
                {/* Rating */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div
                    className="flex items-center gap-1 text-lg tracking-wider text-gold"
                    aria-label={`${review.rating} / 5`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <span
                        key={index}
                        className={
                          index < review.rating
                            ? ""
                            : "text-foreground/20"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
                    {review.rating}/5
                  </span>
                </div>

                {/* Author */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-espresso font-serif text-lg text-ivory">
                    {review.authorName?.trim().charAt(0).toUpperCase() || "?"}
                  </div>

                  <div className="min-w-0">
                    <h2 className="break-words font-semibold text-foreground">
                      {review.authorName}
                    </h2>

                    {review.verified ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-gold">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 1.5 12.2 3l2.7-.1.9 2.5 2.2 1.5-.7 2.6.7 2.6-2.2 1.5-.9 2.5-2.7-.1L10 17.5 7.8 16l-2.7.1-.9-2.5L2 12.1l.7-2.6L2 6.9l2.2-1.5.9-2.5 2.7.1L10 1.5Zm3.2 6.7a.75.75 0 0 0-1.1-1l-2.9 3.1-1.3-1.2a.75.75 0 1 0-1 1.1l1.8 1.8a.75.75 0 0 0 1.1 0l3.4-3.8Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {t("reviews.verified")}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Review message */}
                <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-7 text-foreground/75 sm:text-base">
                  {review.message}
                </p>

                {/* Photos */}
                {review.photoUrls.length > 0 ? (
                  <div className="mt-6">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                      {t("reviews.photoAlt")}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {review.photoUrls.map((url) => {
         const imageUrl = getReviewPhotoUrl(url);

        return (
             <a
              key={url}
              href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group/photo overflow-hidden rounded-xl border border-foreground/10 focus:outline-none focus:ring-2 focus:ring-gold"
                        >
                          <img
                            src={imageUrl}
                            alt={t("reviews.photoAlt")}
                            loading="lazy"
                            className="h-24 w-24 object-cover transition duration-300 group-hover/photo:scale-105 sm:h-32 sm:w-32"
                          />
                             </a>
                           );
                         })}
                    </div>
                  </div>
                ) : null}

                {/* Official reply */}
                {review.officialReply ? (
                  <section className="mt-7 rounded-2xl border border-gold/25 bg-gold/5 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gold">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 10h8M8 14h5m-8 6-1-4a8 8 0 1 1 4 3.5L5 20Z"
                        />
                      </svg>
                      {t("reviews.officialReply")}
                    </div>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-foreground/80">
                      {review.officialReply}
                    </p>
                  </section>
                ) : null}

                {/* Comments */}
                {review.comments.length > 0 ? (
                  <section className="mt-7 border-t border-foreground/10 pt-6">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="h-5 w-5 text-gold"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 10h8M8 14h5m-8 6-1-4a8 8 0 1 1 4 3.5L5 20Z"
                        />
                      </svg>
                      {t("reviews.comments")} ({review.comments.length})
                    </h3>

                    <div className="mt-4 space-y-3">
                      {review.comments.map((comment) => (
                        <div
                          key={comment._id}
                          className="rounded-xl border border-foreground/5 bg-background p-4"
                        >
                          <strong className="text-sm font-semibold">
                            {comment.authorName}
                          </strong>

                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/70">
                            {comment.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {/* Add comment */}
                {user ? (
                  <form
                    className="mt-6 flex flex-col gap-3 border-t border-foreground/10 pt-6 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleComment(review._id);
                    }}
                  >
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
                      aria-label={t("reviews.addComment")}
                      className="min-w-0 flex-1 rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground/40 focus:border-gold focus:ring-2 focus:ring-gold/20"
                    />

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-black transition hover:bg-gold/85 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-background"
                    >
                      {t("reviews.publish")}
                      <span aria-hidden="true">→</span>
                    </button>
                  </form>
                ) : null}

                {/* Like */}
                <div className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-5">
                  <span className="text-xs text-foreground/50">
                    {t("reviews.like")}
                  </span>

                  <button
                    type="button"
                    disabled={likedIds.has(review._id)}
                    onClick={() => void handleLike(review._id)}
                    aria-label={t("reviews.like")}
                    aria-pressed={likedIds.has(review._id)}
                    className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-4 py-2 text-sm font-medium transition hover:border-gold hover:bg-gold/10 hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-base text-gold" aria-hidden="true">
                      ♥
                    </span>
                    <span>{review.likeCount}</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  </main>
);

}
