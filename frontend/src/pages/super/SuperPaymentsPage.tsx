import { useEffect, useState, type FormEvent } from "react";
import {
  getSuperPaymentConfiguration,
  updateSuperPaymentConfiguration,
  type PaymentConfiguration,
} from "../../services/super-payment-configuration.service";

export default function SuperPaymentsPage() {
  const [configuration, setConfiguration] =
    useState<PaymentConfiguration | null>(null);
  const [message, setMessage] = useState("Chargement...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSuperPaymentConfiguration()
      .then((data) => {
        setConfiguration(data);
        setMessage("");
      })
      .catch(() => setMessage("Impossible de charger la configuration."));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!configuration) {
      return;
    }

    try {
      setSaving(true);
      await updateSuperPaymentConfiguration(configuration);
      setMessage("Configuration enregistrée.");
    } catch {
      setMessage("Impossible d'enregistrer la configuration.");
    } finally {
      setSaving(false);
    }
  }

  if (!configuration) {
    return <main className="p-10">{message}</main>;
  }

  const methods = [
    { key: "ccp", title: "CCP" },
    { key: "baridiMob", title: "BaridiMob" },
    { key: "bankTransfer", title: "Virement bancaire" },
  ] as const;

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Marque et paiements
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-foreground/15 p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold">Nom de marque</span>
              <input
                required
                value={configuration.brandName}
                onChange={(event) =>
                  setConfiguration({
                    ...configuration,
                    brandName: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>

            <label>
              <span className="text-sm font-semibold">Raison sociale</span>
              <input
                required
                value={configuration.legalName}
                onChange={(event) =>
                  setConfiguration({
                    ...configuration,
                    legalName: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>
          </div>

         <div className="mt-5 grid gap-5 md:grid-cols-2">
  <label>
    <span className="text-sm font-semibold">
      URL du logo clair
    </span>

    <input
      value={configuration.logoUrl || ""}
      onChange={(event) =>
        setConfiguration({
          ...configuration,
          logoUrl: event.target.value,
        })
      }
      className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
    />
  </label>

  <label>
    <span className="text-sm font-semibold">
      URL du logo sombre
    </span>

    <input
      value={configuration.logoDarkUrl || ""}
      onChange={(event) =>
        setConfiguration({
          ...configuration,
          logoDarkUrl: event.target.value,
        })
      }
      className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
    />
  </label>
</div>

       <div className="mt-5 grid gap-5 md:grid-cols-2">
  <label>
    <span className="text-sm font-semibold">RIP CCP</span>

    <input
      value={configuration.ccpRip}
      onChange={(event) =>
        setConfiguration({
          ...configuration,
          ccpRip: event.target.value,
        })
      }
      className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
    />
  </label>

  <label>
    <span className="text-sm font-semibold">NIF</span>

    <input
      value={configuration.nif}
      onChange={(event) =>
        setConfiguration({
          ...configuration,
          nif: event.target.value,
        })
      }
      className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
    />
  </label>

  <label>
    <span className="text-sm font-semibold">RC</span>

    <input
      value={configuration.rc}
      onChange={(event) =>
        setConfiguration({
          ...configuration,
          rc: event.target.value,
        })
      }
      className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
    />
  </label>

  <label>
    <span className="text-sm font-semibold">WhatsApp</span>

    <input
      type="tel"
      value={configuration.whatsappNumber}
      onChange={(event) =>
        setConfiguration({
          ...configuration,
          whatsappNumber: event.target.value,
        })
      }
      className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
    />
  </label>
</div>

<label className="mt-5 block">
  <span className="text-sm font-semibold">Horaires d’ouverture</span>

  <textarea
    value={configuration.openingHours}
    onChange={(event) =>
      setConfiguration({
        ...configuration,
        openingHours: event.target.value,
      })
    }
    className="mt-2 min-h-28 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
  />
</label>

          <div className="mt-8 space-y-5">
            {methods.map(({ key, title }) => {
              const method = configuration[key];

              return (
                <section
                  key={key}
                  className="rounded-xl border border-foreground/15 p-5"
                >
                  <label className="flex items-center gap-3 font-semibold">
                    <input
                      type="checkbox"
                      checked={method.enabled}
                      onChange={(event) =>
                        setConfiguration({
                          ...configuration,
                          [key]: {
                            ...method,
                            enabled: event.target.checked,
                          },
                        })
                      }
                    />
                    Activer {title}
                  </label>

                  <input
                    value={method.label}
                    onChange={(event) =>
                      setConfiguration({
                        ...configuration,
                        [key]: {
                          ...method,
                          label: event.target.value,
                        },
                      })
                    }
                    placeholder="Libellé"
                    className="mt-4 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                  />

                  <textarea
                    value={method.details}
                    onChange={(event) =>
                      setConfiguration({
                        ...configuration,
                        [key]: {
                          ...method,
                          details: event.target.value,
                        },
                      })
                    }
                    placeholder="Instructions de paiement visibles par le client"
                    className="mt-4 min-h-28 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                  />
                </section>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-xl bg-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>

        {message ? <p className="mt-6">{message}</p> : null}
      </div>
    </main>
  );
}