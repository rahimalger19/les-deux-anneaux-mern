import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import BackButton from "../../components/common/BackButton";

const API_URL = (
  import.meta.env.VITE_API_URL || "/api"
).replace(/\/$/, "");

export default function NewsletterPage() {
  const { locale, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const isEmailAction =
  searchParams.has("token") || searchParams.has("unsubscribe");
  const processedActionRef = useRef<string | null>(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

 useEffect(() => {
  const token = searchParams.get("token");
  const unsubscribeToken = searchParams.get("unsubscribe");

  if (!token && !unsubscribeToken) {
    return;
  }

  const actionKey = unsubscribeToken
    ? `unsubscribe:${unsubscribeToken}`
    : `confirm:${token}`;

  if (processedActionRef.current === actionKey) {
    return;
  }

  processedActionRef.current = actionKey;

  async function confirmSubscription() {
    try {
      setLoading(true);
      setFeedback("");

      const response = await fetch(
        `${API_URL}/newsletter/${
          unsubscribeToken ? "unsubscribe" : "confirm"
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            unsubscribeToken
              ? { token: unsubscribeToken }
              : { token }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to confirm subscription");
      }

      setFeedback(
        unsubscribeToken
          ? t("newsletter.unsubscribeSuccess")
          : t("newsletter.confirmSuccess")
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : t("newsletter.error")
      );
    } finally {
      setLoading(false);
    }
  }

  void confirmSubscription();
}, [searchParams, t]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setFeedback("");

      const response = await fetch(`${API_URL}/newsletter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          phone,
          language: locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to subscribe");
      }

      setFeedback(t("newsletter.subscribeSuccess"));
      setEmail("");
      setPhone("");
    } catch {
      setFeedback(t("newsletter.error"));
    } finally {
      setLoading(false);
    }
  }

  function updateEmail(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
  }

  function updatePhone(event: ChangeEvent<HTMLInputElement>) {
    setPhone(event.target.value);
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="fixed left-4 top-20 z-50 sm:left-6 sm:top-24">
  <BackButton fallback="/" label="Retour à l’accueil" />
</div>
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
        {t("newsletter.eyebrow")}
      </p>

      <h1 className="mt-3 font-serif text-4xl">
        {t("newsletter.title")}
      </h1>

      <p className="mt-4 text-black/70">
        {t("newsletter.description")}
      </p>

      {isEmailAction ? (
  <section className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-green-800">
  {loading ? (
    <p className="text-sm">{t("newsletter.processing")}</p>
  ) : (
    <p className="text-sm font-medium" role="status" aria-live="polite">
      ✓ {feedback}
    </p>
  )}
</section>
) : (
  <form
    onSubmit={handleSubmit}
    className="mt-8 grid gap-5 rounded-2xl border border-black/10 bg-white p-6"
  >
    <input
      type="email"
      value={email}
      onChange={updateEmail}
      placeholder={t("contact.email")}
      required
      className="rounded-lg border border-black/15 px-4 py-3"
    />

    <input
      value={phone}
      onChange={updatePhone}
      placeholder={t("newsletter.phone")}
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
        ? t("newsletter.processing")
        : t("newsletter.subscribe")}
    </button>
  </form>
)}
    </main>
  );
}
