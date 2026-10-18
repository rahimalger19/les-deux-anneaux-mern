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
  <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground sm:px-6 lg:py-16">
    {/* Decorative background */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
    />

    {/* Back button */}
    <div className="fixed left-4 top-20 z-50 sm:left-6 sm:top-24">
      <BackButton  label="Retour à l’accueil" />
    </div>

    <section className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-foreground/10 bg-background shadow-2xl shadow-black/10">
      <div className="h-1 w-full bg-gold" />

      <div className="px-6 py-9 sm:px-9 sm:py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-8 w-8"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">
            {t("newsletter.eyebrow")}
          </p>

          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("newsletter.title")}
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-foreground/60 sm:text-base">
            {t("newsletter.description")}
          </p>

          <div className="mx-auto mt-5 h-px w-16 bg-gold/70" />
        </div>

        {isEmailAction ? (
          <section className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 sm:p-6">
            {loading ? (
              <div className="flex items-center gap-3 text-sm text-foreground/70">
                <span
                  aria-hidden="true"
                  className="h-5 w-5 animate-spin rounded-full border-2 border-gold/25 border-t-gold"
                />
                {t("newsletter.processing")}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400"
                >
                  ✓
                </span>

                <p
                  className="pt-1 text-sm leading-6 text-foreground"
                  role="status"
                  aria-live="polite"
                >
                  {feedback}
                </p>
              </div>
            )}
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-5"
          >
            <div className="grid gap-2">
              <label
                htmlFor="newsletter-email"
                className="text-sm font-semibold"
              >
                {t("contact.email")}
              </label>

              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={updateEmail}
                placeholder="exemple@email.com"
                required
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="newsletter-phone"
                className="text-sm font-semibold"
              >
                {t("newsletter.phone")}
              </label>

              <input
                id="newsletter-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={updatePhone}
                placeholder="+213 ..."
                required
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
              />

              <p className="text-xs leading-5 text-foreground/45">
                Vos coordonnées nous permettent de mieux vous informer.
              </p>
            </div>

            {feedback ? (
              <p
                className="rounded-xl border border-foreground/10 bg-foreground/[0.04] px-4 py-3 text-sm leading-6 text-foreground"
                role="status"
                aria-live="polite"
              >
                {feedback}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-3 rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-gold/15 transition duration-200 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-gold/25 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? t("newsletter.processing")
                : t("newsletter.subscribe")}

              {!loading ? (
                <span aria-hidden="true">→</span>
              ) : null}
            </button>

            <p className="text-center text-xs leading-5 text-foreground/45">
              Les Deux Anneaux · Restez informé de nos actualités.
            </p>
          </form>
        )}
      </div>
    </section>
  </main>
);
}
