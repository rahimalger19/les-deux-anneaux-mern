import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  loginUser,
  requestPhoneLoginOtp,
  verifyPhoneLoginOtp,
  verifyTwoFactorLogin,
} from "../../services/auth.service";

function getOtpTtlSeconds(value: unknown) {
  const seconds = Number(value);

  return Number.isFinite(seconds) && seconds >= 60 ? seconds : 300;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [mode, setMode] = useState<"EMAIL" | "PHONE">("EMAIL");
  const [emailStep, setEmailStep] = useState<"PASSWORD" | "TWO_FACTOR">(
    "PASSWORD"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState("");
  const [phoneOtpExpiresAt, setPhoneOtpExpiresAt] = useState<number | null>(
    null
  );
  const [phoneSecondsRemaining, setPhoneSecondsRemaining] = useState(0);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phoneOtpExpiresAt) {
      return;
    }

    const updateCountdown = () => {
      setPhoneSecondsRemaining(
        Math.max(0, Math.ceil((phoneOtpExpiresAt - Date.now()) / 1000))
      );
    };

    updateCountdown();

    const interval = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(interval);
  }, [phoneOtpExpiresAt]);

  function selectMode(nextMode: "EMAIL" | "PHONE") {
    setMode(nextMode);
    setEmailStep("PASSWORD");
    setOtpCode("");
    setDevelopmentOtp("");
    setPhoneOtpExpiresAt(null);
    setPhoneSecondsRemaining(0);
    setMessage("");
  }

  async function loginWithEmail(event: FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const result = await loginUser({ email, password });

      if (result.requiresTwoFactor) {
        setEmailStep("TWO_FACTOR");
        setOtpCode("");
        setDevelopmentOtp(result.developmentOtp || "");
        setMessage("Un code de sécurité a été envoyé par SMS.");
        return;
      }

      await refreshUser();
      navigate("/espace");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmTwoFactor(event: FormEvent) {
    event.preventDefault();

    if (!/^\d{6}$/.test(otpCode)) {
      setMessage("Le code doit contenir 6 chiffres.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await verifyTwoFactorLogin(email, otpCode);
      await refreshUser();

      navigate("/espace");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Impossible de vérifier le code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendPhoneOtp() {
    if (!phone.trim()) {
      setMessage("Saisissez votre numéro de téléphone.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const result = await requestPhoneLoginOtp(phone.trim());
      const expiresInSeconds = getOtpTtlSeconds(result.expiresInSeconds);

      setOtpCode("");
      setDevelopmentOtp(result.developmentOtp || "");
      setPhoneOtpExpiresAt(Date.now() + expiresInSeconds * 1000);
      setPhoneSecondsRemaining(expiresInSeconds);
      setMessage("Code OTP envoyé.");
    } catch (error: any) {
      const expiresInSeconds = Number(
        error.response?.data?.expiresInSeconds
      );

      if (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
        setPhoneOtpExpiresAt(Date.now() + expiresInSeconds * 1000);
        setPhoneSecondsRemaining(expiresInSeconds);
      }

      setMessage(
        error.response?.data?.message || "Impossible d'envoyer le code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPhone(event: FormEvent) {
    event.preventDefault();

    if (!phoneOtpExpiresAt || phoneSecondsRemaining <= 0) {
      setMessage("Demandez un nouveau code OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setMessage("Le code doit contenir 6 chiffres.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await verifyPhoneLoginOtp(phone.trim(), otpCode);
      await refreshUser();

      navigate("/espace");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Impossible de vérifier le code."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-4xl">Connexion</h1>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => selectMode("EMAIL")}
          className={
            mode === "EMAIL"
              ? "rounded-full bg-black px-5 py-3 text-ivory"
              : "rounded-full border border-black/20 px-5 py-3"
          }
        >
          Email
        </button>

        <button
          type="button"
          onClick={() => selectMode("PHONE")}
          className={
            mode === "PHONE"
              ? "rounded-full bg-black px-5 py-3 text-ivory"
              : "rounded-full border border-black/20 px-5 py-3"
          }
        >
          Téléphone + OTP
        </button>
      </div>

      {mode === "EMAIL" && emailStep === "PASSWORD" ? (
        <form onSubmit={loginWithEmail} className="mt-8 grid gap-5">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="rounded-xl border border-black/15 px-4 py-3"
          />

          <input
            type="password"
            autoComplete="current-password"
            placeholder="Mot de passe"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="rounded-xl border border-black/15 px-4 py-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-black px-6 py-3 font-semibold text-ivory disabled:opacity-50"
          >
            Se connecter
          </button>
        </form>
      ) : null}

      {mode === "EMAIL" && emailStep === "TWO_FACTOR" ? (
        <form onSubmit={confirmTwoFactor} className="mt-8 grid gap-5">
          <p className="rounded-xl bg-ivory p-4">
            Confirmez votre connexion avec le code envoyé à votre téléphone.
          </p>

          {developmentOtp ? (
            <p className="rounded-xl bg-yellow-100 p-4 text-yellow-900">
              Développement uniquement — code : <strong>{developmentOtp}</strong>
            </p>
          ) : null}

          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="Code OTP à 6 chiffres"
            value={otpCode}
            onChange={(event) =>
              setOtpCode(event.target.value.replace(/\D/g, ""))
            }
            required
            className="rounded-xl border border-black/15 px-4 py-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-black px-6 py-3 font-semibold text-ivory disabled:opacity-50"
          >
            Vérifier et se connecter
          </button>

          <button
            type="button"
            onClick={() => selectMode("EMAIL")}
            className="text-sm underline"
          >
            Retour
          </button>
        </form>
      ) : null}

      {mode === "PHONE" ? (
        <form onSubmit={loginWithPhone} className="mt-8 grid gap-5">
          <input
            type="tel"
            autoComplete="tel"
            placeholder="Téléphone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            className="rounded-xl border border-black/15 px-4 py-3"
          />

          <button
            type="button"
            onClick={() => void sendPhoneOtp()}
            disabled={loading || !phone.trim() || phoneSecondsRemaining > 0}
            className="rounded-full border border-black/20 px-6 py-3 font-semibold disabled:opacity-50"
          >
            {phoneSecondsRemaining > 0
              ? `Nouveau code dans ${phoneSecondsRemaining}s`
              : phoneOtpExpiresAt
                ? "Renvoyer le code"
                : "Recevoir le code"}
          </button>

          {phoneOtpExpiresAt ? (
            <>
              <p className="text-sm text-black/70">
                {phoneSecondsRemaining > 0
                  ? `Code valide pendant ${Math.ceil(
                      phoneSecondsRemaining / 60
                    )} minute(s).`
                  : "Le code a expiré. Demandez-en un nouveau."}
              </p>

              {developmentOtp ? (
                <p className="rounded-xl bg-yellow-100 p-4 text-yellow-900">
                  Développement uniquement — code :{" "}
                  <strong>{developmentOtp}</strong>
                </p>
              ) : null}

              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="Code OTP à 6 chiffres"
                value={otpCode}
                onChange={(event) =>
                  setOtpCode(event.target.value.replace(/\D/g, ""))
                }
                required
                className="rounded-xl border border-black/15 px-4 py-3"
              />

              <button
                type="submit"
                disabled={loading || phoneSecondsRemaining <= 0}
                className="rounded-full bg-black px-6 py-3 font-semibold text-ivory disabled:opacity-50"
              >
                Vérifier et se connecter
              </button>
            </>
          ) : null}
        </form>
      ) : null}

      {message ? (
        <p className="mt-5" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      <p className="mt-6">
        <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
      </p>

      <p className="mt-3">
        Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
      </p>
    </main>
  );
}