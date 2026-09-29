import { useEffect, useState } from "react";
import {
  createAdminAvailabilityBlocks,
  deleteAdminAvailabilityBlock,
  getAdminAvailability,
  type AvailabilityBlock,
  type AvailabilityBlockType,
  type BookingSlot,
} from "../../services/admin-availability.service";

const slots: Array<{ value: BookingSlot; label: string }> = [
  { value: "AFTERNOON", label: "Après-midi" },
  { value: "EVENING", label: "Soir" },
  { value: "NIGHT", label: "Nuit" },
  { value: "DAY", label: "Journée" },
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthLater() {
  const date = new Date();
  date.setDate(date.getDate() + 31);

  return date.toISOString().slice(0, 10);
}

export default function AdminAvailabilityPage() {
  const [from, setFrom] = useState(getToday());
  const [to, setTo] = useState(getMonthLater());
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [eventDate, setEventDate] = useState(getToday());
  const [type, setType] =
    useState<AvailabilityBlockType>("MAINTENANCE");
  const [reason, setReason] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<BookingSlot[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadBlocks() {
    try {
      setBlocks(await getAdminAvailability(from, to));
      setMessage("");
    } catch {
      setMessage("Impossible de charger les indisponibilités.");
    }
  }

  useEffect(() => {
    void loadBlocks();
  }, [from, to]);

  function toggleSlot(slot: BookingSlot) {
    setSelectedSlots((current) =>
      current.includes(slot)
        ? current.filter((item) => item !== slot)
        : [...current, slot]
    );
  }

  async function handleCreate() {
    if (!eventDate || selectedSlots.length === 0) {
      setMessage("Choisissez une date et au moins un créneau.");
      return;
    }

    try {
      setSaving(true);

      await createAdminAvailabilityBlocks({
        type,
        reason: reason.trim() || undefined,
        blocks: selectedSlots.map((slot) => ({
          eventDate,
          slot,
        })),
      });

      setReason("");
      setSelectedSlots([]);
      setMessage("Indisponibilité créée.");
      await loadBlocks();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de créer l’indisponibilité."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(blockId: string) {
    if (!window.confirm("Supprimer cette indisponibilité ?")) {
      return;
    }

    try {
      await deleteAdminAvailabilityBlock(blockId);
      setMessage("Indisponibilité supprimée.");
      await loadBlocks();
    } catch {
      setMessage("Impossible de supprimer l’indisponibilité.");
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Indisponibilités</h1>

        <p className="mt-4 text-foreground/70">
          Bloquez des créneaux pour maintenance, indisponibilité manuelle ou
          buffer de préparation.
        </p>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Créer un blocage</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold">Date</span>
              <input
                type="date"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>

            <label>
              <span className="text-sm font-semibold">Type</span>
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as AvailabilityBlockType)
                }
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              >
                <option value="MAINTENANCE">Maintenance</option>
                <option value="MANUAL">Indisponibilité manuelle</option>
                <option value="PREPARATION_BUFFER">
                  Buffer de préparation
                </option>
              </select>
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold">
              Motif facultatif
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              className="mt-2 min-h-24 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            {slots.map((slot) => (
              <label
                key={slot.value}
                className="flex items-center gap-2 rounded-xl border border-foreground/20 px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={selectedSlots.includes(slot.value)}
                  onChange={() => toggleSlot(slot.value)}
                />
                {slot.label}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving}
            className="mt-6 rounded-xl bg-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
          >
            {saving ? "Création..." : "Bloquer les créneaux"}
          </button>
        </section>

        <section className="mt-10 rounded-2xl border border-foreground/15 p-6">
          <div className="flex flex-wrap gap-4">
            <label>
              <span className="text-sm font-semibold">Du</span>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="ml-3 rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
              />
            </label>

            <label>
              <span className="text-sm font-semibold">Au</span>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="ml-3 rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
              />
            </label>
          </div>

          <div className="mt-6 space-y-3">
            {blocks.length === 0 ? (
              <p className="text-foreground/65">
                Aucun blocage dans cette période.
              </p>
            ) : (
              blocks.map((block) => (
                <article
                  key={block.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-foreground/15 p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {block.eventDate} · {block.slots.join(", ")}
                    </p>
                    <p className="mt-1 text-sm text-foreground/65">
                      {block.type}
                      {block.reason ? ` · ${block.reason}` : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDelete(block.id)}
                    className="rounded-xl border border-red-700 px-4 py-2 text-sm font-semibold text-red-700"
                  >
                    Supprimer
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        {message ? <p className="mt-6">{message}</p> : null}
      </div>
    </main>
  );
}