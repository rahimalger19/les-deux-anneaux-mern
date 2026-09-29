
import { useEffect, useState } from "react";
import {
  getDayOfBookings,
  getDayOfPlan,
  saveDayOfPlan,
  type DayOfBooking,
  type DayOfStaffMember,
  type RunSheetEntry,
} from "../../services/admin-day-of.service";

function emptyEntry(): RunSheetEntry {
  return {
    time: "18:00",
    dayOffset: 0,
    label: "",
    staffUserId: undefined,
    notes: "",
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "Jamais enregistré";
  }

  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export default function AdminDayOfPage() {
  const [bookings, setBookings] = useState<DayOfBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedBooking, setSelectedBooking] =
    useState<DayOfBooking | null>(null);
  const [entries, setEntries] = useState<RunSheetEntry[]>([]);
  const [staffMembers, setStaffMembers] = useState<DayOfStaffMember[]>([]);
  const [message, setMessage] = useState("Chargement des événements...");
  const [loading, setLoading] = useState(false);

  async function loadBookings() {
    try {
      const data = await getDayOfBookings();

      setBookings(data);

      if (data.length === 0) {
        setMessage("Aucun événement facturé ou terminé.");
      } else {
        setMessage("");
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de charger les événements."
      );
    }
  }

  useEffect(() => {
    void loadBookings();
  }, []);

  async function selectBooking(bookingId: string) {
    setSelectedBookingId(bookingId);

    if (!bookingId) {
      setSelectedBooking(null);
      setEntries([]);
      setStaffMembers([]);
      return;
    }

    try {
      setLoading(true);

      const data = await getDayOfPlan(bookingId);

      setSelectedBooking(data.booking);
      setStaffMembers(data.staffMembers);

      setEntries(
        data.plan.entries.length > 0
          ? data.plan.entries
          : [emptyEntry()]
      );

      setMessage("");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de charger le planning."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateEntry<K extends keyof RunSheetEntry>(
    index: number,
    field: K,
    value: RunSheetEntry[K]
  ) {
    setEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index
          ? ({ ...entry, [field]: value } as RunSheetEntry)
          : entry
      )
    );
  }

  function removeEntry(index: number) {
    setEntries((current) =>
      current.filter((_, entryIndex) => entryIndex !== index)
    );
  }

  async function handleSave() {
    if (!selectedBookingId) {
      return;
    }

    if (
      entries.length === 0 ||
      entries.some((entry) => !entry.time || !entry.label.trim())
    ) {
      setMessage(
        "Ajoutez au moins une ligne avec une heure et une action."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await saveDayOfPlan(
        selectedBookingId,
        entries.map((entry) => ({
          time: entry.time,
          dayOffset: entry.dayOffset,
          label: entry.label.trim(),
          staffUserId: entry.staffUserId || undefined,
          notes: entry.notes?.trim() || undefined,
        }))
      );

      await loadBookings();

      setSelectedBooking((current) =>
        current
          ? {
              ...current,
              hasPlan: true,
              planUpdatedAt:
                result.planUpdatedAt || current.planUpdatedAt,
            }
          : current
      );

      setMessage(result.message);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d’enregistrer le planning."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Planning jour J</h1>

        <p className="mt-3 text-foreground/70">
          Run-of-show, staff, horaires de nuit et contacts client.
        </p>

        <select
          value={selectedBookingId}
          disabled={loading}
          onChange={(event) => void selectBooking(event.target.value)}
          className="mt-8 w-full max-w-3xl rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
        >
          <option value="">Choisir un événement facturé</option>

          {bookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              {booking.eventDate} · {booking.slot} ·{" "}
              {booking.eventTypeKey} · {booking.client.name}
            </option>
          ))}
        </select>

        {message && <p className="mt-6">{message}</p>}

        {selectedBooking && (
          <>
            <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <p className="text-sm text-foreground/60">
                    Événement
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedBooking.eventTypeKey}
                  </p>

                  <p className="mt-1 text-sm text-foreground/70">
                    {selectedBooking.eventDate} ·{" "}
                    {selectedBooking.slot}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-foreground/60">
                    Client
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedBooking.client.name}
                  </p>

                  <div className="mt-1 text-sm text-foreground/70">
                    {selectedBooking.client.phone ? (
                      <p>{selectedBooking.client.phone}</p>
                    ) : null}

                    {selectedBooking.client.email ? (
                      <p>{selectedBooking.client.email}</p>
                    ) : null}

                    {!selectedBooking.client.phone &&
                    !selectedBooking.client.email ? (
                      <p>Contact indisponible</p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-foreground/60">
                    Invités
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedBooking.womenGuests} femmes ·{" "}
                    {selectedBooking.menGuests} hommes
                  </p>

                  <p className="mt-1 text-sm text-foreground/70">
                    Dernière mise à jour :{" "}
                    {formatDate(selectedBooking.planUpdatedAt)}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">
                  Run-of-show
                </h2>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setEntries((current) => [
                      ...current,
                      emptyEntry(),
                    ])
                  }
                  className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Ajouter une ligne
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {entries.map((entry, index) => (
                  <article
                    key={`${index}-${entry.time}`}
                    className="grid gap-3 rounded-xl border border-foreground/15 p-4 md:grid-cols-[120px_150px_1fr_1fr_1fr_auto]"
                  >
                    <input
                      type="time"
                      value={entry.time}
                      onChange={(event) =>
                        updateEntry(
                          index,
                          "time",
                          event.target.value
                        )
                      }
                      className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                    />

                    <select
                      value={entry.dayOffset}
                      onChange={(event) =>
                        updateEntry(
                          index,
                          "dayOffset",
                          Number(event.target.value) as 0 | 1
                        )
                      }
                      className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                    >
                      <option value={0}>Jour J</option>
                      <option value={1}>Nuit J+1</option>
                    </select>

                    <input
                      value={entry.label}
                      onChange={(event) =>
                        updateEntry(
                          index,
                          "label",
                          event.target.value
                        )
                      }
                      placeholder="Action / étape"
                      className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                    />

                    <select
                      value={entry.staffUserId || ""}
                      onChange={(event) =>
                        updateEntry(
                          index,
                          "staffUserId",
                          event.target.value || undefined
                        )
                      }
                      className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                    >
                      <option value="">
                        Aucun responsable
                      </option>

                      {staffMembers.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} · {staff.role}
                        </option>
                      ))}
                    </select>

                    <input
                      value={entry.notes || ""}
                      onChange={(event) =>
                        updateEntry(
                          index,
                          "notes",
                          event.target.value
                        )
                      }
                      placeholder="Note"
                      className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                    />

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => removeEntry(index)}
                      className="rounded-xl border border-red-700 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      Retirer
                    </button>
                  </article>
                ))}
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => void handleSave()}
                className="mt-6 rounded-xl bg-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
              >
                Enregistrer le planning
              </button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

