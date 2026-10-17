import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  requestPasswordReset,
  resetPassword,
  type PasswordResetChannel,
} from "../../services/auth.service";
import BackButton from "../../components/common/BackButton";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailToken = searchParams.get("token");

  const [channel, setChannel] =
    useState<PasswordResetChannel>("EMAIL");
  const [smsStep, setSmsStep] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [developmentCode, setDevelopmentCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequest(event: FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const result = await requestPasswordReset({
        channel,
        email: channel === "EMAIL" ? email.trim() : undefined,
        phone: channel === "SMS" ? phone.trim() : undefined,
      });

      setMessage(result.message);

      if (channel === "SMS") {
        setDevelopmentCode(result.developmentCode || "");
        setSmsStep(true);
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d'envoyer les instructions."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const result = await resetPassword({
        channel: emailToken ? "EMAIL" : "SMS",
        token: emailToken || code,
        phone: emailToken ? undefined : phone.trim(),
        newPassword,
      });

      setMessage(result.message);
      window.setTimeout(() => navigate("/connexion"), 1200);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de réinitialiser le mot de passe."
      );
    } finally {
      setLoading(false);
    }
  }

  const isResetStep = Boolean(emailToken) || smsStep;

 
  return (
    <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground sm:px-6 lg:py-16">
     <div className="fixed left-4 top-20 z-50 sm:left-6 sm:top-24">
                   <BackButton fallback="/" label="Retour" />
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

      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-foreground/10 bg-background shadow-2xl shadow-black/10">
        <div className="h-1 w-full bg-gold" />

        <div className="px-6 py-9 sm:px-9 sm:py-10">
          {/* Heading */}
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Les Deux Anneaux
            </p>

            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              {isResetStep ? "Nouveau mot de passe" : "Mot de passe oublié"}
            </h1>

            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-foreground/60">
              {isResetStep
                ? "Choisissez un nouveau mot de passe sécurisé pour retrouver l'accès à votre espace."
                : "Pas d'inquiétude. Nous vous aiderons à récupérer l'accès à votre compte."}
            </p>

            <div className="mx-auto mt-5 h-px w-16 bg-gold/70" />
          </div>

          {!isResetStep ? (
            <>
              {/* Recovery method */}
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-1.5">
                <button
                  type="button"
                  onClick={() => setChannel("EMAIL")}
                  aria-pressed={channel === "EMAIL"}
                  className={
                    channel === "EMAIL"
                      ? "rounded-xl bg-espresso px-4 py-3 text-sm font-semibold text-ivory shadow-md transition duration-200"
                      : "rounded-xl px-4 py-3 text-sm font-medium text-foreground/65 transition hover:bg-foreground/5 hover:text-foreground"
                  }
                >
                  Email
                </button>

                <button
                  type="button"
                  onClick={() => setChannel("SMS")}
                  aria-pressed={channel === "SMS"}
                  className={
                    channel === "SMS"
                      ? "rounded-xl bg-espresso px-4 py-3 text-sm font-semibold text-ivory shadow-md transition duration-200"
                      : "rounded-xl px-4 py-3 text-sm font-medium text-foreground/65 transition hover:bg-foreground/5 hover:text-foreground"
                  }
                >
                  SMS
                </button>
              </div>

              <form onSubmit={handleRequest} className="mt-7 grid gap-5">
                {channel === "EMAIL" ? (
                  <div className="grid gap-2">
                    <label
                      htmlFor="recovery-email"
                      className="text-sm font-semibold"
                    >
                      Adresse email
                    </label>

                    <input
                      id="recovery-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="exemple@email.com"
                      required
                      className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
                    />

                    <p className="text-xs leading-5 text-foreground/50">
                      Vous recevrez un lien pour réinitialiser votre mot de
                      passe.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <label
                      htmlFor="recovery-phone"
                      className="text-sm font-semibold"
                    >
                      Numéro de téléphone
                    </label>

                    <input
                      id="recovery-phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+213 ..."
                      required
                      className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
                    />

                    <p className="text-xs leading-5 text-foreground/50">
                      Utilisez le numéro associé à votre compte.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-gold/15 transition duration-200 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-gold/25 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Envoi en cours..."
                    : channel === "EMAIL"
                      ? "Envoyer le lien"
                      : "Recevoir le code SMS"}

                  {!loading && <span aria-hidden="true">→</span>}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleReset} className="mt-7 grid gap-5">
              {!emailToken ? (
                <>
                  <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                    <p className="text-sm leading-6 text-foreground/80">
                      Saisissez le code à 6 chiffres reçu par SMS pour
                      continuer.
                    </p>
                  </div>

                  {developmentCode ? (
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
                      <span className="font-semibold">
                        Mode développement
                      </span>
                      <span className="mt-1 block">
                        Code :{" "}
                        <strong className="tracking-widest">
                          {developmentCode}
                        </strong>
                      </span>
                    </p>
                  ) : null}

                  <div className="grid gap-2">
                    <label
                      htmlFor="recovery-code"
                      className="text-sm font-semibold"
                    >
                      Code de vérification
                    </label>

                    <input
                      id="recovery-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(event) =>
                        setCode(event.target.value.replace(/\D/g, ""))
                      }
                      placeholder="• • • • • •"
                      required
                      className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-4 text-center text-xl font-bold tracking-[0.5em] text-foreground outline-none transition placeholder:text-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
                    />
                  </div>
                </>
              ) : null}

              <div className="grid gap-2">
                <label
                  htmlFor="new-password"
                  className="text-sm font-semibold"
                >
                  Nouveau mot de passe
                </label>

                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Au moins 8 caractères"
                  required
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-semibold"
                >
                  Confirmer le mot de passe
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Répétez votre mot de passe"
                  required
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-gold/15 transition duration-200 hover:-translate-y-0.5 hover:bg-gold/90 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Enregistrement en cours..."
                  : "Enregistrer le mot de passe"}

                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>
          )}

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

          {/* Return to login */}
          <div className="mt-7 border-t border-foreground/10 pt-6 text-center">
            <Link
              to="/connexion"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-foreground/60 transition hover:text-gold"
            >
              <span aria-hidden="true">←</span>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </section>
    </main>
  );

}