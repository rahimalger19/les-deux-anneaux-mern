import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  resendGuestOtp,
  verifyGuestOtp,
} from "../../services/booking.service";
import { trackAnalyticsEvent } from "../../services/analytics.service";
import BookingStepper from "../../components/booking/BookingStepper";

type OtpLocationState = {
  developmentOtp?: string;
  expiresInSeconds?: number;
};

function getOtpTtlSeconds(value: unknown) {
  const ttl = Number(value);

  return Number.isFinite(ttl) && ttl >= 60 ? ttl : 300;
}
function getSecondsRemaining(expiresAt: number) {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}

function getInitialOtpExpiry(
  storageKey: string | null,
  fallbackTtlSeconds: number
) {
  if (storageKey) {
    const storedValue = window.sessionStorage.getItem(storageKey);

    if (storedValue !== null) {
      const storedExpiry = Number(storedValue);

      if (Number.isFinite(storedExpiry) && storedExpiry > 0) {
        return storedExpiry;
      }
    }
  }

  return Date.now() + fallbackTtlSeconds * 1000;
}
export default function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get("bookingId");
  const trackingToken = searchParams.get("token");
  const otpStorageKey = bookingId
  ? `booking-otp-expiry:${bookingId}`
  : null;
  const state = location.state as OtpLocationState | null;

  const initialTtlSeconds = getOtpTtlSeconds(state?.expiresInSeconds);

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState(
    state?.developmentOtp || ""
  );
 const initialExpiresAt = getInitialOtpExpiry(
  otpStorageKey,
  initialTtlSeconds
);

const [expiresAt, setExpiresAt] = useState(initialExpiresAt);

const [secondsRemaining, setSecondsRemaining] = useState(() =>
  getSecondsRemaining(initialExpiresAt)
);
  const [loading, setLoading] = useState(false);

  const trackedVerifiedBookings = useRef(new Set<string>());

  useEffect(() => {
    const interval = window.setInterval(() => {
      const seconds = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 1000)
      );

      setSecondsRemaining(seconds);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [expiresAt]);
useEffect(() => {
  if (otpStorageKey) {
    window.sessionStorage.setItem(
      otpStorageKey,
      String(expiresAt)
    );
  }
}, [expiresAt, otpStorageKey]);
  
 if (!bookingId || !trackingToken) {
  return (
    <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
      />

      <section className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-foreground/10 bg-background shadow-2xl shadow-black/10">
        <div className="h-1 w-full bg-gold" />

        <div className="px-6 py-10 text-center sm:px-9 sm:py-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-8 w-8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6" />
              <path d="M12 16.5h.01" />
            </svg>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Confirmation
          </p>

          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Code OTP introuvable
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-foreground/60">
            Les informations nécessaires à la vérification sont manquantes.
            Retournez à la réservation pour recommencer le processus.
          </p>

          <Link
            to="/reservation"
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-gold/15 transition hover:-translate-y-0.5 hover:bg-gold/90 focus:outline-none focus:ring-4 focus:ring-gold/25 sm:w-auto"
          >
            Retour à la réservation
            <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}


  async function handleVerify() {
    const currentBookingId = bookingId;

    if (!currentBookingId) {
      setMessage("Réservation introuvable.");
      return;
    }
    
    if (secondsRemaining <= 0) {
setMessage("Le code a expiré. Demandez-en un nouveau.");
return;
}

    if (!/^\d{6}$/.test(code)) {
      setMessage("Le code doit contenir 6 chiffres.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await verifyGuestOtp(currentBookingId, code);

      if (!trackedVerifiedBookings.current.has(currentBookingId)) {
        trackedVerifiedBookings.current.add(currentBookingId);

        void trackAnalyticsEvent("OTP_VERIFIED").catch(() => undefined);
      }
    if (otpStorageKey) {
  window.sessionStorage.removeItem(otpStorageKey);
}
      navigate(`/suivi/${trackingToken}`);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de vérifier le code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const currentBookingId = bookingId;

    if (!currentBookingId) {
      setMessage("Réservation introuvable.");
      return;
    }

    if (secondsRemaining > 0) {
      setMessage(
        "Le code actuel est encore valide. Attendez son expiration."
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const result = await resendGuestOtp(currentBookingId);

      setDevelopmentOtp(result.developmentOtp || "");

      const expiresInSeconds = getOtpTtlSeconds(
        (result as { expiresInSeconds?: unknown }).expiresInSeconds
      );

      setExpiresAt(Date.now() + expiresInSeconds * 1000);
      setSecondsRemaining(expiresInSeconds);
      setMessage("Un nouveau code OTP a été envoyé.");
    } catch (error: any) {
      const expiresInSeconds = Number(
  error.response?.data?.expiresInSeconds
);

if (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
  setExpiresAt(Date.now() + expiresInSeconds * 1000);
  setSecondsRemaining(expiresInSeconds);
}

setMessage(
  error.response?.data?.message ||
    "Impossible de renvoyer le code."
);
    } finally {
      setLoading(false);
    }
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

    <section className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-foreground/10 bg-background shadow-2xl shadow-black/10">
      <div className="h-1 w-full bg-gold" />

      <div className="px-6 py-9 sm:px-9 sm:py-10">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-8 w-8"
            >
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Confirmation
          </p>

          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Saisissez votre code OTP
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-foreground/60">
            Entrez le code de vérification reçu pour confirmer votre réservation.
          </p>

          <div className="mx-auto mt-5 h-px w-16 bg-gold/70" />
        </div>

        <div className="mb-7">
          <BookingStepper currentStep={4} />
        </div>

        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            secondsRemaining > 0
              ? "border-gold/20 bg-gold/5 text-foreground/75"
              : "border-red-500/20 bg-red-500/5 text-red-600"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                secondsRemaining > 0
                  ? "bg-gold"
                  : "bg-red-500"
              }`}
            />

            <span>
              {secondsRemaining > 0
                ? `Code valide pendant ${Math.ceil(secondsRemaining / 60)} minute(s).`
                : "Le code a expiré. Demandez-en un nouveau."}
            </span>
          </div>
        </div>

        {developmentOtp ? (
          <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-foreground">
            <p className="font-semibold text-yellow-700 dark:text-yellow-400">
              Mode développement uniquement
            </p>
            <p className="mt-1 text-foreground/65">
              Utilisez ce code pour tester la vérification :
            </p>
            <p className="mt-3 font-mono text-2xl font-bold tracking-[0.35em] text-gold">
              {developmentOtp}
            </p>
          </div>
        ) : null}

        <div className="mt-7 grid gap-2">
          <label
            htmlFor="otp-code"
            className="text-sm font-semibold"
          >
            Code de vérification
          </label>

          <input
            id="otp-code"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, ""))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            aria-label="Code OTP à 6 chiffres"
            placeholder="••••••"
            className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-4 text-center font-mono text-2xl tracking-[0.6em] text-foreground outline-none transition placeholder:text-foreground/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
          />

          <p className="text-xs text-foreground/45">
            Saisissez les 6 chiffres de votre code.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void handleVerify()}
            disabled={loading || secondsRemaining <= 0}
            className="flex w-full items-center justify-center rounded-xl bg-gold px-5 py-3.5 text-sm font-bold text-black shadow-lg shadow-gold/15 transition hover:-translate-y-0.5 hover:bg-gold/90 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Vérification..." : "Vérifier le code"}
          </button>

          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={loading || secondsRemaining > 0}
            className="flex w-full items-center justify-center rounded-xl border border-foreground/15 px-5 py-3.5 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:bg-gold/5 focus:outline-none focus:ring-4 focus:ring-gold/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Renvoyer le code
          </button>
        </div>

        {message ? (
          <p
            className="mt-5 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-4 py-3 text-sm leading-6 text-foreground"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        ) : null}

        <p className="mt-7 text-center text-xs leading-5 text-foreground/45">
          Gardez votre code confidentiel et ne le partagez avec personne.
        </p>
      </div>
    </section>
  </main>
);
}

