import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useLanguage } from "../../hooks/useLanguage";

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

type RequestType = "GENERAL" | "APPOINTMENT";
type AppointmentType = "VISIT" | "VIDEO";
type AppointmentSlot = "DAY" | "EVENING" | "NIGHT";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
  callbackSlot: "EVENING",
  requestType: "APPOINTMENT" as RequestType,
  requestedAppointmentType: "VISIT" as AppointmentType,
  requestedAppointmentSlot: "EVENING" as AppointmentSlot,
};

export default function ContactPage() {
  const { locale } = useLanguage();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  function updateField(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "requestedAppointmentSlot"
        ? { callbackSlot: value }
        : {}),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setFeedback("");

      const isAppointment = form.requestType === "APPOINTMENT";

      const response = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          subject: form.subject,
          message: form.message,
          language: locale,
          callbackSlot: isAppointment
            ? form.requestedAppointmentSlot
            : form.callbackSlot,
          requestType: form.requestType,
          requestedAppointmentType: isAppointment
            ? form.requestedAppointmentType
            : undefined,
          requestedAppointmentSlot: isAppointment
            ? form.requestedAppointmentSlot
            : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible d’envoyer la demande.");
      }

      setFeedback(
        isAppointment
          ? "Votre demande de rendez-vous a été envoyée. Notre équipe confirmera le créneau."
          : "Votre message a été envoyé avec succès."
      );
      setForm(initialForm);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Impossible d’envoyer la demande."
      );
    } finally {
      setLoading(false);
    }
  }

  const isAppointment = form.requestType === "APPOINTMENT";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
        Contact
      </p>

      <h1 className="mt-3 font-serif text-4xl">
        Contact et rendez-vous
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-5 rounded-2xl border border-black/10 bg-white p-6"
      >
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Type de demande</span>
          <select
            name="requestType"
            value={form.requestType}
            onChange={updateField}
            className="rounded-lg border border-black/15 px-4 py-3"
          >
            <option value="APPOINTMENT">Demande de rendez-vous</option>
            <option value="GENERAL">Message général</option>
          </select>
        </label>

        <input
          name="name"
          value={form.name}
          onChange={updateField}
          placeholder="Nom complet"
          required
          className="rounded-lg border border-black/15 px-4 py-3"
        />

        <input
          name="phone"
          value={form.phone}
          onChange={updateField}
          placeholder="Téléphone"
          required
          className="rounded-lg border border-black/15 px-4 py-3"
        />

        <input
          name="email"
          type="email"
          value={form.email}
          onChange={updateField}
          placeholder="Email"
          required
          className="rounded-lg border border-black/15 px-4 py-3"
        />

        <input
          name="subject"
          value={form.subject}
          onChange={updateField}
          placeholder="Sujet"
          required
          className="rounded-lg border border-black/15 px-4 py-3"
        />

        {isAppointment ? (
          <>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Format souhaité</span>
              <select
                name="requestedAppointmentType"
                value={form.requestedAppointmentType}
                onChange={updateField}
                className="rounded-lg border border-black/15 px-4 py-3"
              >
                <option value="VISIT">Visite de la salle</option>
                <option value="VIDEO">Visio diaspora</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">
                Créneau souhaité
              </span>
              <select
                name="requestedAppointmentSlot"
                value={form.requestedAppointmentSlot}
                onChange={updateField}
                className="rounded-lg border border-black/15 px-4 py-3"
              >
                <option value="DAY">Journée</option>
                <option value="EVENING">Soir</option>
                <option value="NIGHT">Nuit</option>
              </select>
            </label>
          </>
        ) : (
          <label className="grid gap-2">
            <span className="text-sm font-semibold">
              Préférence de rappel
            </span>
            <select
              name="callbackSlot"
              value={form.callbackSlot}
              onChange={updateField}
              className="rounded-lg border border-black/15 px-4 py-3"
            >
              <option value="AFTERNOON">Après-midi</option>
              <option value="EVENING">Soir</option>
              <option value="NIGHT">Nuit</option>
              <option value="DAY">Journée</option>
            </select>
          </label>
        )}

        <textarea
          name="message"
          value={form.message}
          onChange={updateField}
          placeholder={
            isAppointment
              ? "Précisez vos disponibilités ou votre demande."
              : "Votre message"
          }
          rows={6}
          required
          className="rounded-lg border border-black/15 px-4 py-3"
        />

        {feedback ? <p className="text-sm">{feedback}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-black px-6 py-3 font-semibold text-ivory disabled:opacity-50"
        >
          {loading
            ? "Envoi..."
            : isAppointment
              ? "Demander un rendez-vous"
              : "Envoyer le message"}
        </button>
      </form>
    </main>
  );
}