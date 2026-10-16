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
  const { locale, t } = useLanguage();

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
          ? t("contact.appointmentSuccess")
          : t("contact.messageSuccess")
      );

      setForm(initialForm);
    } catch {
      setFeedback(t("contact.error"));
    } finally {
      setLoading(false);
    }
  }

  const isAppointment = form.requestType === "APPOINTMENT";

  
return (
  <main className="mx-auto max-w-3xl px-6 py-16">
    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
      {t("contact.eyebrow")}
    </p>

    <h1 className="mt-3 font-serif text-4xl text-foreground">
      {t("contact.title")}
    </h1>

    <form
      onSubmit={handleSubmit}
      className="mt-8 grid gap-5 rounded-2xl border border-foreground/10 bg-surface p-6 sm:p-8"
    >
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-foreground">
          {t("contact.requestType")}
        </span>

        <select
          name="requestType"
          value={form.requestType}
          onChange={updateField}
          className="w-full rounded-lg border border-foreground/20 bg-field px-4 py-3 text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
        >
          <option value="APPOINTMENT">
            {t("contact.appointmentRequest")}
          </option>
          <option value="GENERAL">
            {t("contact.generalRequest")}
          </option>
        </select>
      </label>

      <input
        name="name"
        value={form.name}
        onChange={updateField}
        placeholder={t("contact.name")}
        required
        className="w-full rounded-lg border border-foreground/20 bg-field px-4 py-3 text-foreground placeholder:text-foreground/50 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
      />

      <input
        name="phone"
        value={form.phone}
        onChange={updateField}
        placeholder={t("contact.phone")}
        required
        className="w-full rounded-lg border border-foreground/20 bg-field px-4 py-3 text-foreground placeholder:text-foreground/50 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
      />

      <input
        name="email"
        type="email"
        value={form.email}
        onChange={updateField}
        placeholder={t("contact.email")}
        required
        className="w-full rounded-lg border border-foreground/20 bg-field px-4 py-3 text-foreground placeholder:text-foreground/50 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
      />

      <input
        name="subject"
        value={form.subject}
        onChange={updateField}
        placeholder={t("contact.subject")}
        required
        className="w-full rounded-lg border border-foreground/20 bg-field px-4 py-3 text-foreground placeholder:text-foreground/50 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
      />

      {isAppointment ? (
        <>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">
              {t("contact.appointmentFormat")}
            </span>

            <select
              name="requestedAppointmentType"
              value={form.requestedAppointmentType}
              onChange={updateField}
              className="w-full rounded-lg border border-foreground/20 bg-field px-4 py-3 text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            >
              <option value="VISIT">{t("contact.visit")}</option>
              <option value="VIDEO">{t("contact.video")}</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">
              {t("contact.preferredSlot")}
            </span>

            <select
              name="requestedAppointmentSlot"
              value={form.requestedAppointmentSlot}
              onChange={updateField}
              className="w-full rounded-lg border border-foreground/20 bg-field px-4 py-3 text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            >
              <option value="DAY">{t("contact.day")}</option>
              <option value="EVENING">{t("contact.evening")}</option>
              <option value="NIGHT">{t("contact.night")}</option>
            </select>
          </label>
        </>
      ) : (
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-foreground">
            {t("contact.callbackPreference")}
          </span>

          <select
            name="callbackSlot"
            value={form.callbackSlot}
            onChange={updateField}
            className="w-full rounded-lg border border-foreground/20 bg-field px-4 py-3 text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="AFTERNOON">{t("contact.afternoon")}</option>
            <option value="EVENING">{t("contact.evening")}</option>
            <option value="NIGHT">{t("contact.night")}</option>
            <option value="DAY">{t("contact.day")}</option>
          </select>
        </label>
      )}

      <textarea
        name="message"
        value={form.message}
        onChange={updateField}
        placeholder={
          isAppointment
            ? t("contact.appointmentMessage")
            : t("contact.generalMessage")
        }
        rows={6}
        required
        className="w-full resize-y rounded-lg border border-foreground/20 bg-field px-4 py-3 text-foreground placeholder:text-foreground/50 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
      />

      {feedback ? (
        <p
          role="status"
          className="text-sm text-foreground"
        >
          {feedback}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-black px-6 py-3 font-semibold text-ivory transition-colors hover:bg-espresso disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gold dark:text-black dark:hover:bg-gold/90"
      >
        {loading
          ? t("contact.sending")
          : isAppointment
            ? t("contact.sendAppointment")
            : t("contact.sendMessage")}
      </button>
    </form>
  </main>
);
}