import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  changeMyPassword,
  confirmPhoneChange,
  getMySessions,
  requestPhoneChangeOtp,
  revokeMySession,
  updateMyTwoFactor,
  type ClientSession,
} from "../../services/security.service";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export default function SecurityPage() {
  const { user, refreshUser } = useAuth();

  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [message, setMessage] = useState("Chargement de la sécurité...");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSessions() {
    try {
      const data = await getMySessions();
      setSessions(data);
      setMessage("");
    } catch {
      setMessage("Impossible de charger vos sessions.");
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  async function handleRevoke(sessionId: string) {
    try {
      setLoading(true);
      await revokeMySession(sessionId);
      setMessage("Session déconnectée.");
      await loadSessions();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de déconnecter cette session."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(event: React.FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);

      const result = await changeMyPassword(currentPassword, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setMessage(result.message);
      await loadSessions();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de modifier le mot de passe."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestPhoneOtp(event: React.FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);

      const result = await requestPhoneChangeOtp(newPhone);

      setDevelopmentOtp(result.developmentOtp || "");
      setMessage(result.message);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d'envoyer le code OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPhone(event: React.FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);

      const result = await confirmPhoneChange(otpCode);

      setNewPhone("");
      setOtpCode("");
      setDevelopmentOtp("");
      setMessage(result.message);
      await refreshUser();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de confirmer le numéro."
      );
    } finally {
      setLoading(false);
    }
  }

   async function handleTwoFactorChange() {
  try {
    setLoading(true);

    const result = await updateMyTwoFactor(!user?.twoFactorEnabled);

    setMessage(result.message);
    await refreshUser();
  } catch (error: any) {
    setMessage(
      error.response?.data?.message ||
        "Impossible de modifier l'authentification à deux facteurs."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Sécurité du compte</h1>

        {message && <p className="mt-6 rounded-xl bg-foreground/5 p-4">{message}</p>}

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Mot de passe</h2>

          <form onSubmit={handlePasswordChange} className="mt-5 grid gap-4">
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Mot de passe actuel"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Nouveau mot de passe (8 caractères minimum)"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-fit rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
            >
              Modifier le mot de passe
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Changer le numéro de téléphone</h2>

          <form onSubmit={handleRequestPhoneOtp} className="mt-5 flex flex-wrap gap-3">
            <input
              type="tel"
              required
              value={newPhone}
              onChange={(event) => setNewPhone(event.target.value)}
              placeholder="Nouveau numéro"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
            >
              Recevoir le code
            </button>
          </form>

          {developmentOtp && (
            <p className="mt-5 rounded-xl bg-yellow-100 p-4 text-yellow-900">
              Développement uniquement — code OTP :{" "}
              <strong>{developmentOtp}</strong>
            </p>
          )}

          <form onSubmit={handleConfirmPhone} className="mt-5 flex flex-wrap gap-3">
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(event) =>
                setOtpCode(event.target.value.replace(/\D/g, ""))
              }
              placeholder="Code OTP à 6 chiffres"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-black px-5 py-3 font-semibold text-ivory dark:bg-gold dark:text-black disabled:opacity-50"
            >
              Confirmer le numéro
            </button>
          </form>
        </section>
         
         <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
  <h2 className="text-2xl font-bold">
    Authentification à deux facteurs
  </h2>

  <p className="mt-3 text-foreground/70">
    {user?.twoFactorEnabled
      ? "Un code OTP est demandé après votre mot de passe."
      : "Ajoutez une vérification OTP après votre mot de passe."}
  </p>

  {!user?.phone && (
    <p className="mt-3 rounded-xl bg-yellow-100 p-4 text-yellow-900">
      Ajoutez et confirmez un numéro de téléphone avant d’activer cette
      protection.
    </p>
  )}

  <button
    type="button"
    onClick={() => void handleTwoFactorChange()}
    disabled={loading || (!user?.phone && !user?.twoFactorEnabled)}
    className="mt-5 rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
  >
    {user?.twoFactorEnabled
      ? "Désactiver la double authentification"
      : "Activer la double authentification"}
  </button>
</section>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Sessions actives</h2>

          <div className="mt-5 space-y-4">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-xl border border-foreground/15 p-4"
              >
                <p className="font-semibold">
                  {session.current ? "Cette session" : session.userAgent}
                </p>

                <p className="mt-2 text-sm text-foreground/65">
                  Dernière activité : {formatDate(session.lastSeenAt)}
                </p>

                {!session.current && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleRevoke(session.id)}
                    className="mt-4 rounded-xl border border-red-700 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    Déconnecter cet appareil
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}