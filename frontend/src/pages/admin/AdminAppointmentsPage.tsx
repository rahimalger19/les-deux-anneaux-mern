import { useEffect, useState } from "react";
import {
  getAdminAppointments,
  updateAdminAppointment,
  type AdminAppointment,
} from "../../services/admin-appointment.service";

const slotLabels = {
  DAY: "Journée — 08:00 à 17:59",
  EVENING: "Soir — 18:00 à 23:59",
  NIGHT: "Nuit — 00:00 à 07:59",
} as const;

function formatDate(value?: string) {
  if (!value) {
    return "À planifier";
  }

  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("Chargement des rendez-vous...");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [scheduledAtById, setScheduledAtById] = useState<
    Record<string, string>
  >({});

  const [slotById, setSlotById] = useState<
    Record<string, "DAY" | "EVENING" | "NIGHT">
  >({});

  async function loadAppointments() {
    try {
      const data = await getAdminAppointments({
        status: status || undefined,
        source:
          source === "ACCOUNT" || source === "CONTACT"
            ? source
            : undefined,
        date: date || undefined,
      });

      setAppointments(data);

      setMessage(
        data.length === 0
          ? "Aucun rendez-vous ne correspond aux filtres."
          : ""
      );
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de charger les rendez-vous."
      );
    }
  }

  useEffect(() => {
    void loadAppointments();
  }, [status, source, date]);

  async function handleConfirm(appointment: AdminAppointment) {
    const localDateTime = scheduledAtById[appointment.id];
    const appointmentSlot =
      slotById[appointment.id] || appointment.requestedSlot || "DAY";

    if (!localDateTime) {
      setMessage(
        "Choisissez une date et une heure avant de confirmer le rendez-vous."
      );
      return;
    }

    try {
      setProcessingId(appointment.id);

      const result = await updateAdminAppointment(appointment.id, {
        action: "CONFIRM",
        scheduledAt: new Date(localDateTime).toISOString(),
        appointmentSlot,
      });

      setMessage(result.message);
      await loadAppointments();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de confirmer le rendez-vous."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCancel(appointmentId: string) {
    if (!window.confirm("Annuler ce rendez-vous ?")) {
      return;
    }

    try {
      setProcessingId(appointmentId);

      const result = await updateAdminAppointment(appointmentId, {
        action: "CANCEL",
      });

      setMessage(result.message);
      await loadAppointments();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d’annuler le rendez-vous."
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

        <h1 className="mt-2 text-4xl font-bold">Rendez-vous showroom</h1>

        <p className="mt-3 text-foreground/70">
          Traitez les demandes contact RDV et confirmez les créneaux de
          journée, du soir ou de nuit.
        </p>

        <section className="mt-8 flex flex-wrap gap-4 rounded-2xl border border-foreground/15 p-6">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmé</option>
            <option value="CANCELLED">Annulé</option>
          </select>

          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          >
            <option value="">Toutes les origines</option>
            <option value="CONTACT">Demande contact</option>
            <option value="ACCOUNT">Espace client</option>
          </select>

          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          />
        </section>

        {message ? <p className="mt-6">{message}</p> : null}

        <section className="mt-8 space-y-4">
          {appointments.map((appointment) => {
            const selectedSlot =
              slotById[appointment.id] ||
              appointment.requestedSlot ||
              "DAY";

            return (
              <article
                key={appointment.id}
                className="rounded-2xl border border-foreground/15 p-6"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-foreground/60">Client</p>
                    <p className="font-semibold">
                      {appointment.client?.name || "Client indisponible"}
                    </p>
                    <p className="mt-1 text-sm text-foreground/70">
                      {appointment.client?.phone ||
                        appointment.client?.email ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground/60">
                      Rendez-vous
                    </p>
                    <p className="font-semibold">
                      {formatDate(appointment.scheduledAt)}
                    </p>
                    <p className="mt-1 text-sm text-foreground/70">
                      {appointment.source === "CONTACT"
                        ? "Demande contact"
                        : "Espace client"}{" "}
                      ·{" "}
                      {appointment.type === "VISIT"
                        ? "Visite de la salle"
                        : "Visio diaspora"}{" "}
                      · {appointment.status}
                    </p>

                    {appointment.requestedSlot ? (
                      <p className="mt-1 text-sm text-gold">
                        Créneau souhaité :{" "}
                        {slotLabels[appointment.requestedSlot]}
                      </p>
                    ) : null}
                  </div>
                </div>

                {appointment.notes ? (
                  <p className="mt-5 rounded-xl bg-foreground/5 p-4 text-sm">
                    {appointment.notes}
                  </p>
                ) : null}

                {appointment.status === "PENDING" ? (
                  <section className="mt-5 rounded-xl border border-gold/50 p-4">
                    <h2 className="font-semibold">
                      Confirmer le créneau
                    </h2>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <input
                        type="datetime-local"
                        value={scheduledAtById[appointment.id] || ""}
                        onChange={(event) =>
                          setScheduledAtById((current) => ({
                            ...current,
                            [appointment.id]: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                      />

                      <select
                        value={selectedSlot}
                        onChange={(event) =>
                          setSlotById((current) => ({
                            ...current,
                            [appointment.id]: event.target.value as
                              | "DAY"
                              | "EVENING"
                              | "NIGHT",
                          }))
                        }
                        className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                      >
                        <option value="DAY">{slotLabels.DAY}</option>
                        <option value="EVENING">{slotLabels.EVENING}</option>
                        <option value="NIGHT">{slotLabels.NIGHT}</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={processingId === appointment.id}
                      onClick={() => void handleConfirm(appointment)}
                      className="mt-4 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
                    >
                      Confirmer le rendez-vous
                    </button>
                  </section>
                ) : null}

                {appointment.status !== "CANCELLED" ? (
                  <button
                    type="button"
                    disabled={processingId === appointment.id}
                    onClick={() => void handleCancel(appointment.id)}
                    className="mt-5 rounded-xl border border-red-700 px-5 py-3 font-semibold text-red-700 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                ) : null}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}