import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  requestPasswordReset,
  resetPassword,
  type PasswordResetChannel,
} from "../../services/auth.service";

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
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-4xl">
        {isResetStep ? "Nouveau mot de passe" : "Mot de passe oublié"}
      </h1>

      {!isResetStep ? (
        <>
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => setChannel("EMAIL")}
              className={
                channel === "EMAIL"
                  ? "rounded-full bg-black px-5 py-3 text-ivory"
                  : "rounded-full border border-black/20 px-5 py-3"
              }
            >
              Email
            </button>

            <button
              type="button"
              onClick={() => setChannel("SMS")}
              className={
                channel === "SMS"
                  ? "rounded-full bg-black px-5 py-3 text-ivory"
                  : "rounded-full border border-black/20 px-5 py-3"
              }
            >
              SMS
            </button>
          </div>

          <form onSubmit={handleRequest} className="mt-8 grid gap-5">
            {channel === "EMAIL" ? (
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Votre email"
                required
                className="rounded-xl border border-black/15 px-4 py-3"
              />
            ) : (
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Votre numéro de téléphone"
                required
                className="rounded-xl border border-black/15 px-4 py-3"
              />
            )}

            <button
              disabled={loading}
              className="rounded-full bg-black px-6 py-3 font-semibold text-ivory disabled:opacity-50"
            >
              {loading
                ? "Envoi..."
                : channel === "EMAIL"
                  ? "Envoyer le lien"
                  : "Recevoir le code SMS"}
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={handleReset} className="mt-8 grid gap-5">
          {!emailToken ? (
            <>
              <p className="text-sm text-black/70">
                Saisissez le code à 6 chiffres reçu par SMS.
              </p>

              {developmentCode ? (
                <p className="rounded-xl bg-yellow-100 p-4 text-yellow-900">
                  Développement uniquement — code :{" "}
                  <strong>{developmentCode}</strong>
                </p>
              ) : null}

              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
                placeholder="Code SMS à 6 chiffres"
                required
                className="rounded-xl border border-black/15 px-4 py-3"
              />
            </>
          ) : null}

          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Nouveau mot de passe"
            required
            className="rounded-xl border border-black/15 px-4 py-3"
          />

          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirmer le nouveau mot de passe"
            required
            className="rounded-xl border border-black/15 px-4 py-3"
          />

          <button
            disabled={loading}
            className="rounded-full bg-black px-6 py-3 font-semibold text-ivory disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
          </button>
        </form>
      )}

      {message ? (
        <p className="mt-5" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      <Link to="/connexion" className="mt-8 inline-block underline">
        Retour à la connexion
      </Link>
    </main>
  );
}