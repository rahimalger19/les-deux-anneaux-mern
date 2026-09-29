import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { registerUser } from "../../services/auth.service";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    language: "fr-DZ" as "fr-DZ" | "ar-DZ" | "en",
    currency: "DZD" as "DZD" | "EUR" | "USD",
    newsletterOptIn: false,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      await registerUser(form);
      await refreshUser();

      navigate("/espace");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-4xl">Créer un compte</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        <input
          placeholder="Nom complet"
          type="text"
          autoComplete="name"
          minLength={2}
          maxLength={120}
          value={form.name}
          onChange={(event) =>
            setForm({ ...form, name: event.target.value })
          }
          required
          className="rounded-xl border border-black/15 px-4 py-3"
        />

        <input
          placeholder="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) =>
            setForm({ ...form, email: event.target.value })
          }
          required
          className="rounded-xl border border-black/15 px-4 py-3"
        />

        <input
          placeholder="Téléphone"
          type="tel"
          autoComplete="tel"
          minLength={8}
          value={form.phone}
          onChange={(event) =>
            setForm({ ...form, phone: event.target.value })
          }
          className="rounded-xl border border-black/15 px-4 py-3"
        />

        <input
          placeholder="Mot de passe"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={form.password}
          onChange={(event) =>
            setForm({ ...form, password: event.target.value })
          }
          required
          className="rounded-xl border border-black/15 px-4 py-3"
        />

        <select
          value={form.language}
          onChange={(event) =>
            setForm({
              ...form,
              language: event.target.value as "fr-DZ" | "ar-DZ" | "en",
            })
          }
          className="rounded-xl border border-black/15 px-4 py-3"
        >
          <option value="fr-DZ">Français</option>
          <option value="ar-DZ">العربية</option>
          <option value="en">English</option>
        </select>

        <select
          value={form.currency}
          onChange={(event) =>
            setForm({
              ...form,
              currency: event.target.value as "DZD" | "EUR" | "USD",
            })
          }
          className="rounded-xl border border-black/15 px-4 py-3"
        >
          <option value="DZD">DZD</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.newsletterOptIn}
            onChange={(event) =>
              setForm({
                ...form,
                newsletterOptIn: event.target.checked,
              })
            }
          />

          <span>Je souhaite recevoir la newsletter.</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-black px-6 py-3 font-semibold text-ivory"
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      {message ? (
  <p className="mt-5" role="status" aria-live="polite">
    {message}
  </p>
) : null}

      <p className="mt-6">
        Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
      </p>
    </main>
  );
}