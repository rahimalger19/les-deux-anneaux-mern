import { useEffect, useState } from "react";
import {
  cancelAppointment,
  createAppointment,
  getMyAppointments,
  type Appointment,
} from "../../services/appointment.service";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [type, setType] = useState<"VISIT" | "VIDEO">("VISIT");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  async function loadAppointments() {
    try {
      setAppointments(await getMyAppointments());
    } catch {
      setMessage("Impossible de charger les rendez-vous.");
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!scheduledAt) {
      setMessage("Choisissez une date et une heure.");
      return;
    }

    try {
      await createAppointment({
        type,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes,
      });

      setScheduledAt("");
      setNotes("");
      setMessage("Demande de rendez-vous envoyée.");
      await loadAppointments();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de créer le rendez-vous."
      );
    }
  }

  async function handleCancel(id: string) {
    await cancelAppointment(id);
    await loadAppointments();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Mes rendez-vous</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-foreground/15 p-6"
        >
          <h2 className="text-2xl font-bold">Demander un rendez-vous</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold">Type</span>

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as "VISIT" | "VIDEO")
                }
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              >
                <option value="VISIT">Visite de la salle</option>
                <option value="VIDEO">Visio diaspora</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold">
                Date et heure - Algérie
              </span>

              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold">Note optionnelle</span>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={1000}
              className="mt-2 min-h-28 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />
          </label>

          <button
            type="submit"
            className="mt-5 rounded-xl bg-gold px-6 py-3 font-semibold text-black"
          >
            Envoyer la demande
          </button>
        </form>

        {message && <p className="mt-6">{message}</p>}

        <section className="mt-10 space-y-4">
          {appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="rounded-2xl border border-foreground/15 p-6"
            >
              <p className="font-semibold">
                {appointment.type === "VISIT"
                  ? "Visite de la salle"
                  : "Visio diaspora"}
              </p>

              <p className="mt-2">{formatDate(appointment.scheduledAt)}</p>

              <p className="mt-2 text-gold">{appointment.status}</p>

              {appointment.notes && (
                <p className="mt-3 text-sm text-foreground/70">
                  {appointment.notes}
                </p>
              )}

              {appointment.status !== "CANCELLED" && (
                <button
                  type="button"
                  onClick={() => handleCancel(appointment.id)}
                  className="mt-5 rounded-xl border border-red-700 px-4 py-2 text-sm font-semibold text-red-700"
                >
                  Annuler
                </button>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}