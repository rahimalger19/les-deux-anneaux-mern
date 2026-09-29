import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminBookings,
  getAssignableAgents,
  type AdminBooking,
  type AdminBookingPage,
  type AssignableAgent,
} from "../../services/admin-booking.service";

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [agents, setAgents] = useState<AssignableAgent[]>([]);
  const [eventTypes, setEventTypes] = useState<
    AdminBookingPage["filters"]["eventTypes"]
  >([]);

  const [source, setSource] = useState<"" | "ONLINE" | "WALK_IN">("");
  const [eventTypeKey, setEventTypeKey] = useState("");
  const [currency, setCurrency] = useState<
  "" | "DZD" | "EUR" | "USD"
>("");
  const [agent, setAgent] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("Chargement des réservations...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAssignableAgents()
      .then(setAgents)
      .catch(() =>
        setMessage("Impossible de charger la liste des agents.")
      );
  }, []);

  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
       
        const data = await getAdminBookings({
          source: source || undefined,
          eventTypeKey: eventTypeKey || undefined,
          currency: currency || undefined,
          agent: agent || undefined,
          status: status || undefined,
          search: appliedSearch || undefined,
          page,
          limit: 25,
        });

        setBookings(data.bookings);
        setEventTypes(data.filters.eventTypes);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);

        setMessage(
          data.bookings.length === 0
            ? "Aucune réservation ne correspond aux filtres."
            : ""
        );
      } catch (error: any) {
        setMessage(
          error.response?.data?.message ||
            "Impossible de charger les réservations."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadBookings();
  }, [source, eventTypeKey, currency, agent, status, appliedSearch, page]);

  function changeFilter(
    update: () => void
  ) {
    setPage(1);
    update();
  }

  function applySearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  }

  function clearFilters() {
    setSource("");
    setEventTypeKey("");
    setCurrency("");
    setAgent("");
    setStatus("");
    setSearch("");
    setAppliedSearch("");
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Réservations</h1>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <select
              value={source}
              onChange={(event) => {
  changeFilter(() =>
    setSource(event.target.value as "" | "ONLINE" | "WALK_IN")
  );
}}
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="">Toutes les sources</option>
              <option value="ONLINE">En ligne</option>
              <option value="WALK_IN">Saisie sur place</option>
            </select>

            <select
              value={eventTypeKey}
              onChange={(event) =>
                changeFilter(() => setEventTypeKey(event.target.value))
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="">Tous les types d’événement</option>

              {eventTypes.map((eventType) => (
                <option key={eventType.key} value={eventType.key}>
                  {eventType.name.fr}
                  {eventType.active ? "" : " — archivé"}
                </option>
              ))}
            </select>

            <select
              value={currency}
               onChange={(event) => {
  changeFilter(() =>
    setCurrency(event.target.value as "" | "DZD" | "EUR" | "USD")
  );
}}
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="">Toutes les devises</option>
              <option value="DZD">DZD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>

            <select
              value={agent}
              onChange={(event) =>
                changeFilter(() => setAgent(event.target.value))
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="">Tous les agents</option>
              <option value="unassigned">Non attribué</option>

              {agents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.role}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) =>
                changeFilter(() => setStatus(event.target.value))
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PRICED">Devis calculé</option>
              <option value="OTP_PENDING">OTP en attente</option>
              <option value="HELD">Créneau bloqué</option>
              <option value="PROOF_PENDING">Preuve en attente</option>
              <option value="PAID">Payé</option>
              <option value="INVOICED">Facturé</option>
              <option value="DONE">Terminé</option>
              <option value="CANCELLED">Annulé</option>
              <option value="EXPIRED">Expiré</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-foreground/20 px-5 py-3 font-semibold"
            >
              Réinitialiser les filtres
            </button>
          </div>

          <form
            onSubmit={applySearch}
            className="mt-4 flex flex-wrap gap-3"
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Client, téléphone, date ou événement"
              maxLength={100}
              className="min-w-64 flex-1 rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="submit"
              className="rounded-xl bg-gold px-5 py-3 font-semibold text-black"
            >
              Rechercher
            </button>
          </form>
        </section>

        <p className="mt-6 text-sm text-foreground/65">
          {loading ? "Chargement..." : `${total} réservation(s) trouvée(s)`}
        </p>

        {message ? <p className="mt-4">{message}</p> : null}

        <section className="mt-6 overflow-x-auto rounded-2xl border border-foreground/15">
          <table className="w-full min-w-[1150px] text-left text-sm">
            <thead className="border-b border-foreground/15 text-foreground/65">
              <tr>
                <th className="p-4">Date / créneau</th>
                <th className="p-4">Événement</th>
                <th className="p-4">Client</th>
                <th className="p-4">Source</th>
                <th className="p-4">Agent</th>
                <th className="p-4">Marché</th>
                <th className="p-4">Devise</th>
                <th className="p-4">Acompte DZD</th>
                <th className="p-4">Statut</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-foreground/10 last:border-0"
                >
                  <td className="p-4">
                    <Link
                      to={`/admin/reservations/${booking.id}`}
                      className="font-semibold hover:text-gold"
                    >
                      {booking.eventDate}
                    </Link>

                    <p className="mt-1 text-foreground/65">
                      {booking.slot}
                    </p>
                  </td>

                  <td className="p-4">
                    <p className="font-semibold">{booking.eventTypeKey}</p>
                    <p className="mt-1 text-foreground/65">
                      {booking.womenGuests} F · {booking.menGuests} H
                    </p>
                  </td>

                  <td className="p-4">
                    <p>{booking.client?.name || "Client invité"}</p>
                    <p className="mt-1 text-foreground/65">
                      {booking.client?.phone ||
                        booking.guestPhone ||
                        booking.client?.email ||
                        "—"}
                    </p>
                  </td>

                  <td className="p-4">
                    {booking.source === "WALK_IN" ? "Sur place" : "En ligne"}
                  </td>

                  <td className="p-4">
                    {booking.assignedAgent?.name || "Non attribué"}
                  </td>

                  <td className="p-4">
                    {booking.pricingMarket === "DIASPORA"
                      ? "Diaspora"
                      : "Résidence DZ"}
                  </td>

                  <td className="p-4">{booking.currency}</td>

                  <td className="p-4">
                    {formatDZD(booking.depositDZD)}
                  </td>

                  <td className="p-4 font-semibold text-gold">
                    {booking.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-xl border border-foreground/20 px-5 py-3 font-semibold disabled:opacity-40"
          >
            ← Précédent
          </button>

          <p className="text-sm text-foreground/65">
            Page {page} sur {totalPages}
          </p>

          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-xl border border-foreground/20 px-5 py-3 font-semibold disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      </div>
    </main>
  );
}