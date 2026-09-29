import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";

const API_URL = import.meta.env.VITE_API_URL;

export default function NewsletterPage() {
  const { locale } = useLanguage();
  const [searchParams] = useSearchParams();

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

    async function confirmSubscription() {
      try {
        setLoading(true);

        const response = await fetch(
  `${API_URL}/newsletter/${unsubscribeToken ? "unsubscribe" : "confirm"}`,
  {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
            body: JSON.stringify(
  unsubscribeToken
    ? { token: unsubscribeToken }
    : { token }
),        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to confirm subscription");
        }

        setFeedback(data.message);
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "Unable to confirm subscription"
        );
      } finally {
        setLoading(false);
      }
    }

    void confirmSubscription();
  }, [searchParams]);

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

      setFeedback(data.message);
      setEmail("");
      setPhone("");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to subscribe"
      );
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
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
        Newsletter
      </p>

      <h1 className="mt-3 font-serif text-4xl">
        Recevez nos actualités
      </h1>

      <p className="mt-4 text-black/70">
        Confirmez votre email pour finaliser votre inscription.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-5 rounded-2xl border border-black/10 bg-white p-6"
      >
        <input
          type="email"
          value={email}
          onChange={updateEmail}
          placeholder="Email"
          required
          className="rounded-lg border border-black/15 px-4 py-3"
        />

        <input
          value={phone}
          onChange={updatePhone}
          placeholder="Téléphone"
          required
          className="rounded-lg border border-black/15 px-4 py-3"
        />

        {feedback ? <p className="text-sm">{feedback}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-black px-6 py-3 font-semibold text-ivory disabled:opacity-50"
        >
          {loading ? "Traitement..." : "M’inscrire"}
        </button>
      </form>
    </main>
  );
}