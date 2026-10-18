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
import { getDashboardRoute } from "../../lib/dashboard-route";
import BackButton from "../../components/common/BackButton";

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

      const authenticatedUser = await refreshUser();

navigate(getDashboardRoute(authenticatedUser?.role), {
  replace: true,
});
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

const authenticatedUser = await refreshUser();

navigate(getDashboardRoute(authenticatedUser?.role), {
  replace: true,
});
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

const authenticatedUser = await refreshUser();

navigate(getDashboardRoute(authenticatedUser?.role), {
  replace: true,
});
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Impossible de vérifier le code."
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

      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-foreground/10 bg-background shadow-2xl shadow-black/10">
        {/* Gold accent */}
        <div className="h-1 w-full bg-gold" />

        <div className="px-6 py-9 sm:px-9 sm:py-10">
          {/* Heading */}
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Les Deux Anneaux
            </p>

            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Connexion
            </h1>

            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-foreground/60">
              Retrouvez votre espace et gérez vos réservations en toute
              simplicité.
            </p>

            <div className="mx-auto mt-5 h-px w-16 bg-gold/70" />
          </div>

          {/* Login method selector */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-1.5">
            <button
              type="button"
              onClick={() => selectMode("EMAIL")}
              aria-pressed={mode === "EMAIL"}
              className={
                mode === "EMAIL"
                  ? "rounded-xl bg-espresso px-3 py-3 text-sm font-semibold text-ivory shadow-md transition duration-200"
                  : "rounded-xl px-3 py-3 text-sm font-medium text-foreground/65 transition duration-200 hover:bg-foreground/5 hover:text-foreground"
              }
            >
              Email
            </button>

            <button
              type="button"
              onClick={() => selectMode("PHONE")}
              aria-pressed={mode === "PHONE"}
              className={
                mode === "PHONE"
                  ? "rounded-xl bg-espresso px-3 py-3 text-sm font-semibold text-ivory shadow-md transition duration-200"
                  : "rounded-xl px-3 py-3 text-sm font-medium text-foreground/65 transition duration-200 hover:bg-foreground/5 hover:text-foreground"
              }
            >
              Téléphone + OTP
            </button>
          </div>

          {/* Email and password */}
          {mode === "EMAIL" && emailStep === "PASSWORD" ? (
            <form onSubmit={loginWithEmail} className="mt-7 grid gap-5">
              <div className="grid gap-2">
                <label
                  htmlFor="login-email"
                  className="text-sm font-semibold"
                >
                  Adresse email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="login-password"
                  className="text-sm font-semibold"
                >
                  Mot de passe
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Saisissez votre mot de passe"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-gold/15 transition duration-200 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-gold/25 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>
          ) : null}

          {/* Email two-factor authentication */}
          {mode === "EMAIL" && emailStep === "TWO_FACTOR" ? (
            <form onSubmit={confirmTwoFactor} className="mt-7 grid gap-5">
              <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                <p className="text-sm font-medium leading-6">
                  Confirmez votre connexion avec le code envoyé à votre
                  téléphone.
                </p>
              </div>

              {developmentOtp ? (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
                  <span className="font-semibold">Mode développement</span>
                  <span className="mt-1 block">
                    Code : <strong className="tracking-widest">{developmentOtp}</strong>
                  </span>
                </p>
              ) : null}

              <div className="grid gap-2">
                <label htmlFor="email-otp" className="text-sm font-semibold">
                  Code de sécurité
                </label>
                <input
                  id="email-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(event) =>
                    setOtpCode(event.target.value.replace(/\D/g, ""))
                  }
                  required
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-4 text-center text-xl font-bold tracking-[0.5em] text-foreground outline-none transition placeholder:text-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
                />
                <p className="text-xs text-foreground/50">
                  Saisissez les 6 chiffres du code reçu.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-black transition duration-200 hover:bg-gold/90 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Vérification..." : "Vérifier et se connecter"}
              </button>

              <button
                type="button"
                onClick={() => selectMode("EMAIL")}
                className="mx-auto rounded-lg px-4 py-2 text-sm font-medium text-foreground/60 transition hover:text-gold"
              >
                ← Retour à la connexion
              </button>
            </form>
          ) : null}

          {/* Phone and OTP login */}
          {mode === "PHONE" ? (
            <form onSubmit={loginWithPhone} className="mt-7 grid gap-5">
              <div className="grid gap-2">
                <label htmlFor="login-phone" className="text-sm font-semibold">
                  Numéro de téléphone
                </label>
                <input
                  id="login-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+213 ..."
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground/35 hover:border-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
                />
                <p className="text-xs leading-5 text-foreground/50">
                  Utilisez le numéro associé à votre compte.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void sendPhoneOtp()}
                disabled={loading || !phone.trim() || phoneSecondsRemaining > 0}
                className="w-full rounded-xl border border-gold/50 bg-gold/5 px-5 py-3.5 text-sm font-semibold text-foreground transition duration-200 hover:border-gold hover:bg-gold/10 focus:outline-none focus:ring-4 focus:ring-gold/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {phoneSecondsRemaining > 0
                  ? `Nouveau code dans ${phoneSecondsRemaining}s`
                  : phoneOtpExpiresAt
                    ? "Renvoyer le code"
                    : "Recevoir le code"}
              </button>

              {phoneOtpExpiresAt ? (
                <>
                  <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4">
                    <p className="text-sm leading-6 text-foreground/70">
                      {phoneSecondsRemaining > 0
                        ? `Code valide pendant ${Math.ceil(
                            phoneSecondsRemaining / 60
                          )} minute(s).`
                        : "Le code a expiré. Demandez-en un nouveau."}
                    </p>
                    {phoneSecondsRemaining > 0 ? (
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                        <div
                          className="h-full rounded-full bg-gold transition-all duration-1000"
                          style={{
                            width: `${Math.min(
                              100,
                              (phoneSecondsRemaining /
                                getOtpTtlSeconds(
                                  phoneOtpExpiresAt
                                    ? (phoneOtpExpiresAt - Date.now()) / 1000
                                    : 300
                                )) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  {developmentOtp ? (
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
                      <span className="font-semibold">Mode développement</span>
                      <span className="mt-1 block">
                        Code : <strong className="tracking-widest">{developmentOtp}</strong>
                      </span>
                    </p>
                  ) : null}

                  <div className="grid gap-2">
                    <label htmlFor="phone-otp" className="text-sm font-semibold">
                      Code OTP
                    </label>
                    <input
                      id="phone-otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(event) =>
                        setOtpCode(event.target.value.replace(/\D/g, ""))
                      }
                      required
                      className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-4 text-center text-xl font-bold tracking-[0.5em] text-foreground outline-none transition placeholder:text-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phoneSecondsRemaining <= 0}
                    className="w-full rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-gold/15 transition duration-200 hover:bg-gold/90 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Vérification..." : "Vérifier et se connecter"}
                  </button>
                </>
              ) : null}
            </form>
          ) : null}

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

          {/* Account links */}
          <div className="mt-7 space-y-4 border-t border-foreground/10 pt-6 text-center">
            <p>
              <Link
                to="/mot-de-passe-oublie"
                className="text-sm font-medium text-foreground/60 underline decoration-foreground/20 underline-offset-4 transition hover:text-gold hover:decoration-gold"
              >
                Mot de passe oublié ?
              </Link>
            </p>

            <p className="text-sm text-foreground/60">
              Pas encore de compte ?{" "}
              <Link
                to="/inscription"
                className="font-semibold text-gold transition hover:underline hover:underline-offset-4"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );

}