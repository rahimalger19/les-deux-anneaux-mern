import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  getSuperSmsConfiguration,
  updateSuperSmsConfiguration,
  type SmsConfiguration,
  type SmsLog,
  type SmsProviderStatus,
} from "../../services/super-sms.service";

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SuperSmsPage() {
  const [configuration, setConfiguration] =
    useState<SmsConfiguration | null>(null);

  const [providerStatus, setProviderStatus] =
    useState<SmsProviderStatus | null>(null);

  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [message, setMessage] = useState("Chargement...");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const data = await getSuperSmsConfiguration();

      setConfiguration(data.configuration);
      setProviderStatus(data.providerStatus);
      setLogs(data.logs);
      setMessage("");
    } catch {
      setMessage("Impossible de charger la configuration SMS.");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!configuration) {
      return;
    }

    try {
      setSaving(true);

      await updateSuperSmsConfiguration(configuration);

      setMessage("Configuration SMS enregistrée.");
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d’enregistrer la configuration SMS."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!configuration) {
    return <main className="p-10">{message}</main>;
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">SMS et OTP</h1>

        <p className="mt-4 text-foreground/70">
          Les identifiants Twilio restent protégés dans
          <code> backend/.env</code>. Aucun secret n’est affiché ici.
        </p>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-xl font-bold">Fournisseur et crédits</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-foreground/5 p-4">
              <p className="text-sm text-foreground/65">Fournisseur</p>
              <p className="mt-1 font-semibold">
                {providerStatus?.provider || "TWILIO"}
              </p>
            </div>

            <div className="rounded-xl bg-foreground/5 p-4">
              <p className="text-sm text-foreground/65">Identifiants</p>
              <p className="mt-1 font-semibold">
                {providerStatus?.credentialsConfigured
                  ? "Configurés"
                  : "Absents"}
              </p>
            </div>

            <div className="rounded-xl bg-foreground/5 p-4">
              <p className="text-sm text-foreground/65">
                Expéditeur Twilio
              </p>
              <p className="mt-1 font-semibold">
                {providerStatus?.senderConfigured
                  ? "Configuré"
                  : "Absent"}
              </p>
            </div>

            <div className="rounded-xl bg-foreground/5 p-4">
              <p className="text-sm text-foreground/65">Crédits</p>
              <p className="mt-1 font-semibold">
                {providerStatus?.balance === null ||
                providerStatus?.balance === undefined
                  ? "Indisponibles"
                  : `${providerStatus.balance} ${
                      providerStatus.currency || ""
                    }`}
              </p>
            </div>
          </div>

          {providerStatus?.balanceError ? (
            <p className="mt-4 text-sm text-red-700">
              {providerStatus.balanceError}
            </p>
          ) : null}
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-foreground/15 p-6"
        >
          <h2 className="text-xl font-bold">Configuration OTP</h2>

          <label className="mt-6 flex items-center gap-3 font-semibold">
            <input
              type="checkbox"
              checked={configuration.enabled}
              onChange={(event) =>
                setConfiguration({
                  ...configuration,
                  enabled: event.target.checked,
                })
              }
            />
            Activer l’envoi des SMS OTP
          </label>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold">Fournisseur</span>
              <input
                value="Twilio"
                disabled
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3 opacity-70"
              />
            </label>

            <label>
              <span className="text-sm font-semibold">
                TTL OTP, en secondes
              </span>
              <input
                required
                type="number"
                min="60"
                value={configuration.otpTtlSeconds}
                onChange={(event) =>
                  setConfiguration({
                    ...configuration,
                    otpTtlSeconds: Number(event.target.value),
                  })
                }
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>
          </div>

          <label className="mt-6 block">
            <span className="text-sm font-semibold">Nom affiché</span>
            <input
              required
              value={configuration.senderLabel}
              onChange={(event) =>
                setConfiguration({
                  ...configuration,
                  senderLabel: event.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />
          </label>

          <label className="mt-6 block">
            <span className="text-sm font-semibold">Modèle SMS OTP</span>
            <textarea
              required
              value={configuration.otpTemplate}
              onChange={(event) =>
                setConfiguration({
                  ...configuration,
                  otpTemplate: event.target.value,
                })
              }
              className="mt-2 min-h-32 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />
          </label>

          <p className="mt-3 text-sm text-foreground/60">
            Variable obligatoire : {"{{code}}"}. Variable disponible :{" "}
            {"{{minutes}}"}.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-xl bg-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Journal OTP / SMS</h2>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-foreground/15">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="bg-foreground/5">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Destinataire</th>
                  <th className="px-4 py-3">Fournisseur</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Détail</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-foreground/10"
                  >
                    <td className="px-4 py-3">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">{log.phoneMasked}</td>
                    <td className="px-4 py-3">{log.provider}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          log.status === "SENT"
                            ? "font-semibold text-green-700"
                            : log.status === "FAILED"
                              ? "font-semibold text-red-700"
                              : "font-semibold text-foreground/65"
                        }
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.error || log.providerMessageId || "—"}
                    </td>
                  </tr>
                ))}

                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-foreground/65"
                    >
                      Aucun SMS OTP n’a encore été journalisé.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {message ? <p className="mt-6">{message}</p> : null}
      </div>
    </main>
  );
}