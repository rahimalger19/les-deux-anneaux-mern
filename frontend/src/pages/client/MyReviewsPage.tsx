import { useEffect, useState } from "react";
import {
  createMyReview,
  getMyReviewableBookings,
  getMyReviews,
  type Review,
  type ReviewableBooking,
} from "../../services/community.service";

export default function MyReviewsPage() {
  const [bookings, setBookings] = useState<ReviewableBooking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState("");

  async function loadData() {
    const [bookingData, reviewData] = await Promise.all([
      getMyReviewableBookings(),
      getMyReviews(),
    ]);

    setBookings(bookingData);
    setReviews(reviewData);
  }

  useEffect(() => {
    loadData().catch(() =>
      setMessage("Impossible de charger vos avis.")
    );
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      await createMyReview({
        bookingId,
        rating,
        message: reviewMessage,
        photos,
      });

      setBookingId("");
      setRating(5);
      setReviewMessage("");
      setPhotos([]);
      setMessage("Votre avis a été envoyé pour modération.");
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d'envoyer votre avis."
      );
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Mes avis</h1>

        {bookings.length > 0 && (
          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-foreground/15 p-6"
          >
            <h2 className="text-2xl font-bold">Donner votre avis</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <select
                required
                value={bookingId}
                onChange={(event) => setBookingId(event.target.value)}
                className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              >
                <option value="">Choisir un événement terminé</option>

                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.eventTypeKey} — {booking.eventDate}
                  </option>
                ))}
              </select>

              <select
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              >
                <option value={5}>5 étoiles</option>
                <option value={4}>4 étoiles</option>
                <option value={3}>3 étoiles</option>
                <option value={2}>2 étoiles</option>
                <option value={1}>1 étoile</option>
              </select>
            </div>

            <textarea
              required
              value={reviewMessage}
              onChange={(event) => setReviewMessage(event.target.value)}
              maxLength={2000}
              placeholder="Votre expérience"
              className="mt-5 min-h-32 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              multiple
              onChange={(event) =>
                setPhotos(Array.from(event.target.files || []))
              }
              className="mt-5 block w-full rounded-xl border border-foreground/20 p-3"
            />

            <button
              type="submit"
              className="mt-5 rounded-xl bg-gold px-6 py-3 font-semibold text-black"
            >
              Envoyer mon avis
            </button>
          </form>
        )}

        {bookings.length === 0 && (
          <p className="mt-8">
            Vous pourrez laisser un avis après un événement terminé.
          </p>
        )}

        {message && <p className="mt-6">{message}</p>}

        <section className="mt-10 space-y-4">
          {reviews.map((review) => (
            <article
              key={review._id}
              className="rounded-2xl border border-foreground/15 p-6"
            >
              <p className="text-gold">{"★".repeat(review.rating)}</p>
              <p className="mt-3">{review.message}</p>
              <p className="mt-4 text-sm font-semibold">
                Statut : {review.status}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}