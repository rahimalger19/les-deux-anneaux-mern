import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getMyBookings,
  type ClientBooking,
} from "../../services/client-booking.service";
import {
  createMySupportTicket,
  getMySupportTickets,
  type SupportTicket,
} from "../../services/support-ticket.service";

export default function HelpPage() {
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    const [bookingData, ticketData] = await Promise.all([
      getMyBookings(),
      getMySupportTickets(),
    ]);

    setBookings(bookingData);
    setTickets(ticketData);
  }

  useEffect(() => {
    loadData().catch(() =>
      setMessage("Impossible de charger l'aide.")
    );
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      await createMySupportTicket({
        subject,
        message: ticketMessage,
        bookingId: bookingId || undefined,
      });

      setSubject("");
      setTicketMessage("");
      setBookingId("");
      setMessage("Ticket envoyé.");
      await loadData();
    } catch {
      setMessage("Impossible d'envoyer le ticket.");
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Aide et tickets</h1>

        <Link
          to="/faq"
          className="mt-6 inline-block rounded-xl border border-gold px-5 py-3 font-semibold text-gold"
        >
          Consulter la FAQ
        </Link>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-foreground/15 p-6"
        >
          <h2 className="text-2xl font-bold">Ouvrir un ticket</h2>

          <select
            value={bookingId}
            onChange={(event) => setBookingId(event.target.value)}
            className="mt-5 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          >
            <option value="">Aucune réservation associée</option>

            {bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                {booking.eventTypeKey} — {booking.eventDate}
              </option>
            ))}
          </select>

          <input
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Sujet"
            maxLength={150}
            className="mt-5 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          />

          <textarea
            required
            value={ticketMessage}
            onChange={(event) => setTicketMessage(event.target.value)}
            placeholder="Votre demande"
            maxLength={3000}
            className="mt-5 min-h-32 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          />

          <button
            type="submit"
            className="mt-5 rounded-xl bg-gold px-6 py-3 font-semibold text-black"
          >
            Envoyer le ticket
          </button>
        </form>

        {message && <p className="mt-6">{message}</p>}

        <section className="mt-10 space-y-4">
          {tickets.map((ticket) => (
            <article
              key={ticket._id}
              className="rounded-2xl border border-foreground/15 p-6"
            >
              <h2 className="font-semibold">{ticket.subject}</h2>
              <p className="mt-2 text-foreground/70">{ticket.message}</p>
              <p className="mt-4 text-sm font-semibold text-gold">
                Statut : {ticket.status}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}