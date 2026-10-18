import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { registerUser } from "../../services/auth.service";
import BackButton from "../../components/common/BackButton";

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
    <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground sm:px-6 lg:py-16">
      
<div className="absolute left-4 top-4 z-50 sm:left-6 sm:top-6"
     style={{
       paddingTop: "env(safe-area-inset-top)",
       paddingLeft: "env(safe-area-inset-left)",
     }}>
  <BackButton  label="Retour à l’accueil" />
</div>

      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
      />

      <section className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-foreground/10 bg-background shadow-2xl shadow-black/10">
        {/* Gold accent */}
        <div className="h-1 w-full bg-gold" />

        <div className="px-6 py-9 sm:px-9 sm:py-10">
          {/* Heading */}
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Les Deux Anneaux
            </p>

            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Créer un compte
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-foreground/60">
              Rejoignez-nous pour découvrir nos services et gérer vos
              réservations en toute simplicité.
            </p>

            <div className="mx-auto mt-5 h-px w-16 bg-gold/70" />
          </div>

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="register-name" className="text-sm font-semibold">
                Nom complet
              </label>

              <input
                id="register-name"
                placeholder="Votre nom complet"
                type="text"
                autoComplete="name"
                minLength={2}
                maxLength={120}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="register-email"
                className="text-sm font-semibold"
              >
                Adresse email
              </label>

              <input
                id="register-email"
                placeholder="exemple@email.com"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                required
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="register-phone"
                className="text-sm font-semibold"
              >
                Téléphone
                <span className="ml-2 font-normal text-foreground/40">
                  (facultatif)
                </span>
              </label>

              <input
                id="register-phone"
                placeholder="+213 ..."
                type="tel"
                autoComplete="tel"
                minLength={8}
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="register-password"
                className="text-sm font-semibold"
              >
                Mot de passe
              </label>

              <input
                id="register-password"
                placeholder="Au moins 8 caractères"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                required
                className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
              />

              <p className="text-xs leading-5 text-foreground/50">
                Utilisez au moins 8 caractères.
              </p>
            </div>

            {/* Preferences */}
            <div className="grid gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                Préférences
              </p>

              <div className="grid gap-2">
                <label
                  htmlFor="register-language"
                  className="text-sm font-medium"
                >
                  Langue préférée
                </label>

                <select
                  id="register-language"
                  value={form.language}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      language: event.target.value as
                        | "fr-DZ"
                        | "ar-DZ"
                        | "en",
                    })
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
                >
                  <option value="fr-DZ">Français</option>
                  <option value="ar-DZ">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="register-currency"
                  className="text-sm font-medium"
                >
                  Devise préférée
                </label>

                <select
                  id="register-currency"
                  value={form.currency}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      currency: event.target.value as "DZD" | "EUR" | "USD",
                    })
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
                >
                  <option value="DZD">DZD — Dinar algérien</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="USD">USD — Dollar américain</option>
                </select>
              </div>
            </div>

            {/* Newsletter */}
            <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-transparent p-3 transition hover:border-foreground/10 hover:bg-foreground/[0.025]">
              <input
                type="checkbox"
                checked={form.newsletterOptIn}
                onChange={(event) =>
                  setForm({
                    ...form,
                    newsletterOptIn: event.target.checked,
                  })
                }
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#C6A15B] focus:ring-2 focus:ring-gold/30"
              />

              <span className="text-sm leading-6 text-foreground/70 transition group-hover:text-foreground">
                Je souhaite recevoir la newsletter et les actualités de
                Les Deux Anneaux.
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-gold/15 transition duration-200 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-gold/25 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Création en cours..." : "Créer mon compte"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          {/* Status message */}
          {message ? (
            <p
              className="mt-5 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-4 py-3 text-sm leading-6 text-foreground"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          ) : null}

          {/* Login link */}
          <div className="mt-7 border-t border-foreground/10 pt-6 text-center">
            <p className="text-sm text-foreground/60">
              Déjà inscrit ?{" "}
              <Link
                to="/connexion"
                className="font-semibold text-gold transition hover:underline hover:underline-offset-4"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );

}