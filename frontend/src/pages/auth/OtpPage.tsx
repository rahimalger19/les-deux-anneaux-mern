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
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-serif text-4xl">Code OTP introuvable</h1>

      <BookingStepper currentStep={4} />
        <Link
          to="/reservation"
          className="mt-6 inline-block rounded-full bg-black px-5 py-3 text-ivory"
        >
          Retour à la réservation
        </Link>
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
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
        Confirmation
      </p>

      <h1 className="mt-3 font-serif text-4xl">
        Saisissez votre code OTP
      </h1>

      <p className="mt-4 text-black/70">
  {secondsRemaining > 0
    ? `Code valide pendant ${Math.ceil(secondsRemaining / 60)} minute(s).`
    : "Le code a expiré. Demandez-en un nouveau."}
</p>

      {developmentOtp ? (
        <p className="mt-5 rounded-xl bg-yellow-100 p-4 text-yellow-900">
          Développement uniquement — code :
          <strong className="ml-2 text-xl">{developmentOtp}</strong>
        </p>
      ) : null}

      <input
  value={code}
  onChange={(event) =>
    setCode(event.target.value.replace(/\D/g, ""))
  }
  inputMode="numeric"
  autoComplete="one-time-code"
  maxLength={6}
  required
  aria-label="Code OTP à 6 chiffres"
  placeholder="Code à 6 chiffres"
  className="mt-8 w-full rounded-xl border border-black/15 px-4 py-3"
/>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleVerify()}
          disabled={loading || secondsRemaining <= 0}
          className="rounded-full bg-black px-6 py-3 font-semibold text-ivory"
        >
          Vérifier le code
        </button>

        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={loading || secondsRemaining > 0}
          className="rounded-full border border-black/20 px-6 py-3 font-semibold disabled:opacity-40"
        >
          Renvoyer le code
        </button>
      </div>

      {message ? (
  <p className="mt-5 text-sm" role="status" aria-live="polite">
    {message}
  </p>
) : null}
    </main>
  );
}

