import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  createAvailabilityBlocks,
  deleteAvailabilityBlock,
  getAdminCalendar,
  type AvailabilityBlock,
  type AvailabilityBlockType,
  type BookingSlot,
  type BookingStatus,
  type CalendarBooking,
} from "../../services/admin-availability.service";

const slots: BookingSlot[] = [
  "AFTERNOON",
  "EVENING",
  "NIGHT",
  "DAY",
];

const slotLabels: Record<BookingSlot, string> = {
  AFTERNOON: "Après-midi",
  EVENING: "Soir",
  NIGHT: "Nuit",
  DAY: "Journée",
};

const bookingStatusLabels: Record<BookingStatus, string> = {
  DRAFT: "Brouillon",
  PRICED: "Devis calculé",
  OTP_PENDING: "OTP en attente",
  HELD: "Hold",
  PROOF_PENDING: "Preuve en attente",
  PAID: "Payé",
  INVOICED: "Facturé",
  DONE: "Terminé",
  CANCELLED: "Annulé",
  EXPIRED: "Expiré",
};

const bookingStatusClasses: Record<BookingStatus, string> = {
  DRAFT: "border-slate-400/50 bg-slate-400/10",
  PRICED: "border-sky-500/50 bg-sky-500/10",
  OTP_PENDING: "border-yellow-500/50 bg-yellow-500/10",
  HELD: "border-amber-500/50 bg-amber-500/15",
  PROOF_PENDING: "border-orange-500/50 bg-orange-500/15",
  PAID: "border-blue-500/50 bg-blue-500/15",
  INVOICED: "border-violet-500/50 bg-violet-500/15",
  DONE: "border-emerald-500/50 bg-emerald-500/15",
  CANCELLED: "border-red-500/50 bg-red-500/10",
  EXPIRED: "border-red-700/50 bg-red-700/10",
};

const blockClasses: Record<AvailabilityBlockType, string> = {
  MAINTENANCE: "border-red-500/50 bg-red-500/10",
  MANUAL: "border-rose-500/50 bg-rose-500/10",
  PREPARATION_BUFFER: "border-purple-500/50 bg-purple-500/10",
};

type ViewMode = "WEEK" | "MONTH";
type DragAction = "SELECT" | "DESELECT";

function getAlgeriaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Algiers",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
}

function dateFromKey(date: string) {
  return new Date(`${date}T12:00:00.000Z`);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const result = dateFromKey(date);
  result.setUTCDate(result.getUTCDate() + days);

  return toDateKey(result);
}

function addMonths(date: string, months: number) {
  const result = dateFromKey(date);

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  return toDateKey(result);
}

function getMonday(date: string) {
  const result = dateFromKey(date);
  const weekday = result.getUTCDay() || 7;

  result.setUTCDate(result.getUTCDate() - weekday + 1);

  return toDateKey(result);
}

function getWeekDates(date: string) {
  const monday = getMonday(date);

  return Array.from({ length: 7 }, (_, index) =>
    addDays(monday, index)
  );
}

function getMonthDates(date: string) {
  const firstDay = dateFromKey(date);

  firstDay.setUTCDate(1);

  const firstDayKey = toDateKey(firstDay);
  const gridStart = getMonday(firstDayKey);

  return Array.from({ length: 42 }, (_, index) =>
    addDays(gridStart, index)
  );
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat("fr-DZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Algiers",
  }).format(dateFromKey(date));
}

function formatMonth(date: string) {
  return new Intl.DateTimeFormat("fr-DZ", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Algiers",
  }).format(dateFromKey(date));
}

function keyFor(eventDate: string, slot: BookingSlot) {
  return `${eventDate}:${slot}`;
}

export default function AdminCalendarPage() {
  const [view, setView] = useState<ViewMode>("WEEK");
  const [anchorDate, setAnchorDate] = useState(getAlgeriaToday());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [blockType, setBlockType] =
    useState<AvailabilityBlockType>("MANUAL");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("Chargement du calendrier...");
  const [saving, setSaving] = useState(false);

  const dragAction = useRef<DragAction | null>(null);

  const dates = useMemo(
    () => (view === "WEEK" ? getWeekDates(anchorDate) : getMonthDates(anchorDate)),
    [anchorDate, view]
  );

  const calendarRange = useMemo(
    () => ({
      from: dates[0],
      to: dates[dates.length - 1],
    }),
    [dates]
  );

  const bookingsBySlot = useMemo(() => {
    const result = new Map<string, CalendarBooking>();

    for (const booking of bookings) {
      result.set(keyFor(booking.eventDate, booking.slot), booking);
    }

    return result;
  }, [bookings]);

  const blocksBySlot = useMemo(() => {
    const result = new Map<string, AvailabilityBlock>();

    for (const block of blocks) {
      for (const slot of block.slots) {
        result.set(keyFor(block.eventDate, slot), block);
      }
    }

    return result;
  }, [blocks]);

  async function loadCalendar() {
    try {
      const data = await getAdminCalendar(
        calendarRange.from,
        calendarRange.to
      );

      setBookings(data.bookings);
      setBlocks(data.blocks);
      setSelectedKeys([]);
      setMessage("");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de charger le calendrier."
      );
    }
  }

  useEffect(() => {
    void loadCalendar();
  }, [calendarRange.from, calendarRange.to]);

  useEffect(() => {
    function stopDragging() {
      dragAction.current = null;
    }

    window.addEventListener("pointerup", stopDragging);

    return () => window.removeEventListener("pointerup", stopDragging);
  }, []);

  function updateSelection(
    eventDate: string,
    slot: BookingSlot,
    action: DragAction
  ) {
    const key = keyFor(eventDate, slot);

    if (bookingsBySlot.has(key) || blocksBySlot.has(key)) {
      return;
    }

    setSelectedKeys((current) => {
      if (action === "SELECT") {
        return current.includes(key) ? current : [...current, key];
      }

      return current.filter((value) => value !== key);
    });
  }

  function beginSelection(eventDate: string, slot: BookingSlot) {
    const key = keyFor(eventDate, slot);

    if (bookingsBySlot.has(key) || blocksBySlot.has(key)) {
      return;
    }

    const action: DragAction = selectedKeys.includes(key)
      ? "DESELECT"
      : "SELECT";

    dragAction.current = action;
    updateSelection(eventDate, slot, action);
  }

  function continueSelection(eventDate: string, slot: BookingSlot) {
    if (!dragAction.current) {
      return;
    }

    updateSelection(eventDate, slot, dragAction.current);
  }

  async function handleCreateBlocks() {
    if (selectedKeys.length === 0) {
      setMessage("Sélectionnez au moins un créneau libre.");
      return;
    }

    try {
      setSaving(true);

      await createAvailabilityBlocks({
        type: blockType,
        reason: reason.trim() || undefined,
        blocks: selectedKeys.map((value) => {
          const [eventDate, slot] = value.split(":");

          return {
            eventDate,
            slot: slot as BookingSlot,
          };
        }),
      });

      setReason("");
      setSelectedKeys([]);
      setMessage("Blocages créés.");
      await loadCalendar();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de créer les blocages."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBlock(blockId: string) {
    if (!window.confirm("Supprimer ce blocage ?")) {
      return;
    }

    try {
      setSaving(true);
      await deleteAvailabilityBlock(blockId);
      setMessage("Blocage supprimé.");
      await loadCalendar();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de supprimer le blocage."
      );
    } finally {
      setSaving(false);
    }
  }

  function movePeriod(direction: -1 | 1) {
    setAnchorDate((current) =>
      view === "WEEK"
        ? addDays(current, direction * 7)
        : addMonths(current, direction)
    );
  }

  function renderSlotCell(
    eventDate: string,
    slot: BookingSlot,
    compact = false
  ) {
    const key = keyFor(eventDate, slot);
    const booking = bookingsBySlot.get(key);
    const block = blocksBySlot.get(key);
    const selected = selectedKeys.includes(key);

    const stateClass = booking
      ? bookingStatusClasses[booking.status]
      : block
        ? blockClasses[block.type]
        : selected
          ? "border-black bg-black text-ivory"
          : "border-foreground/15 bg-transparent hover:border-gold";

    return (
      <div
        key={key}
        onPointerDown={(event) => {
          event.preventDefault();
          beginSelection(eventDate, slot);
        }}
        onPointerEnter={() => continueSelection(eventDate, slot)}
        className={`touch-none select-none rounded-xl border p-3 ${stateClass} ${
          compact ? "min-h-20" : "min-h-28"
        } ${booking || block ? "cursor-default" : "cursor-pointer"}`}
      >
        {booking ? (
          <Link
            to={`/admin/reservations/${booking.id}`}
            className="block"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-semibold">
              {bookingStatusLabels[booking.status]}
            </p>

            <p className="mt-1 text-sm">{booking.eventTypeKey}</p>

            {!compact ? (
              <p className="mt-1 text-xs">
                {booking.womenGuests} F · {booking.menGuests} H
              </p>
            ) : null}
          </Link>
        ) : block ? (
          <>
            <p className="text-xs font-semibold">
              {block.type === "MAINTENANCE"
                ? "Maintenance"
                : block.type === "MANUAL"
                  ? "Blocage manuel"
                  : "Buffer préparation"}
            </p>

            {block.reason && !compact ? (
              <p className="mt-1 text-xs">{block.reason}</p>
            ) : null}
          </>
        ) : selected ? (
          <p className="text-sm font-semibold">Sélectionné</p>
        ) : (
          <p className="text-sm text-foreground/45">
            {compact ? slotLabels[slot] : "Libre"}
          </p>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Calendrier maître</h1>

        <p className="mt-3 text-foreground/70">
          Sélectionnez ou glissez sur les créneaux libres. La ligne Nuit reste
          toujours disponible dans les vues semaine et mois.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setView("WEEK")}
            className={`rounded-xl px-5 py-3 font-semibold ${
              view === "WEEK"
                ? "bg-gold text-black"
                : "border border-foreground/20"
            }`}
          >
            Semaine
          </button>

          <button
            type="button"
            onClick={() => setView("MONTH")}
            className={`rounded-xl px-5 py-3 font-semibold ${
              view === "MONTH"
                ? "bg-gold text-black"
                : "border border-foreground/20"
            }`}
          >
            Mois
          </button>

          <button
            type="button"
            onClick={() => movePeriod(-1)}
            className="rounded-xl border border-foreground/20 px-4 py-3 font-semibold"
          >
            ← Précédent
          </button>

          <button
            type="button"
            onClick={() => movePeriod(1)}
            className="rounded-xl border border-foreground/20 px-4 py-3 font-semibold"
          >
            Suivant →
          </button>

          <button
            type="button"
            onClick={() => setAnchorDate(getAlgeriaToday())}
            className="rounded-xl border border-foreground/20 px-4 py-3 font-semibold"
          >
            Aujourd’hui
          </button>

          <label className="ml-auto grid gap-1 text-sm font-semibold">
            Date de référence
            <input
              type="date"
              value={anchorDate}
              onChange={(event) => setAnchorDate(event.target.value)}
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />
          </label>
        </div>

        <p className="mt-5 font-semibold">
          {view === "WEEK"
            ? `Du ${formatDay(calendarRange.from)} au ${formatDay(
                calendarRange.to
              )}`
            : formatMonth(anchorDate)}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full border border-amber-500/50 bg-amber-500/15 px-3 py-2">
            Hold
          </span>
          <span className="rounded-full border border-orange-500/50 bg-orange-500/15 px-3 py-2">
            Preuve en attente
          </span>
          <span className="rounded-full border border-blue-500/50 bg-blue-500/15 px-3 py-2">
            Payé
          </span>
          <span className="rounded-full border border-violet-500/50 bg-violet-500/15 px-3 py-2">
            Facturé
          </span>
          <span className="rounded-full border border-emerald-500/50 bg-emerald-500/15 px-3 py-2">
            Terminé
          </span>
          <span className="rounded-full border border-red-500/50 bg-red-500/10 px-3 py-2">
            Maintenance
          </span>
          <span className="rounded-full border border-purple-500/50 bg-purple-500/10 px-3 py-2">
            Buffer préparation
          </span>
        </div>

        {view === "WEEK" ? (
          <div className="mt-8 overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-8 gap-2">
                <div className="p-3 text-sm font-semibold">Créneau</div>

                {dates.map((date) => (
                  <div
                    key={date}
                    className="rounded-xl border border-foreground/15 p-3 text-center text-sm font-semibold"
                  >
                    {formatDay(date)}
                  </div>
                ))}

                {slots.map((slot) => (
                  <Fragment key={slot}>
                    <div className="flex items-center rounded-xl border border-foreground/15 p-3 text-sm font-semibold">
                      {slotLabels[slot]}
                    </div>

                    {dates.map((date) => renderSlotCell(date, slot))}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {dates.map((date) => {
              const isCurrentMonth =
                date.slice(0, 7) === anchorDate.slice(0, 7);

              return (
                <section
                  key={date}
                  className={`rounded-xl border p-3 ${
                    isCurrentMonth
                      ? "border-foreground/15"
                      : "border-foreground/10 opacity-55"
                  }`}
                >
                  <p className="mb-3 text-sm font-semibold">
                    {formatDay(date)}
                  </p>

                  <div className="space-y-2">
                    {slots.map((slot) => renderSlotCell(date, slot, true))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <section className="mt-10 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Créer les blocages sélectionnés</h2>

          <p className="mt-2 text-sm text-foreground/65">
            Créneaux sélectionnés : {selectedKeys.length}
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <select
              value={blockType}
              onChange={(event) =>
                setBlockType(event.target.value as AvailabilityBlockType)
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="MANUAL">Blocage manuel</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="PREPARATION_BUFFER">
                Buffer de préparation
              </option>
            </select>

            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              placeholder="Motif optionnel"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="button"
              onClick={() => void handleCreateBlocks()}
              disabled={saving || selectedKeys.length === 0}
              className="rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
            >
              Créer les blocages
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Blocages affichés</h2>

          <div className="mt-5 space-y-3">
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
                      {block.eventDate} · {block.type}
                    </p>

                    <p className="mt-1 text-sm text-foreground/70">
                      {block.slots.map((slot) => slotLabels[slot]).join(", ")}
                      {block.reason ? ` · ${block.reason}` : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDeleteBlock(block.id)}
                    disabled={saving}
                    className="rounded-xl border border-red-700 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
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