import { useEffect, useState, type FormEvent } from "react";
import {
  createDiasporaCountry,
  getSuperCurrencies,
  saveSuperCurrencyRate,
  updateDiasporaCountry,
  type DiasporaCountry,
  type DiasporaGrid,
  type ExchangeRate,
} from "../../services/super-currency.service";

const currencies: Array<"EUR" | "USD"> = ["EUR", "USD"];

function formatDZD(value: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value);
}



export default function SuperCurrenciesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [countries, setCountries] = useState<DiasporaCountry[]>([]);
  const [diasporaGrid, setDiasporaGrid] =
    useState<DiasporaGrid | null>(null);

  const [values, setValues] = useState<Record<string, string>>({});
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [message, setMessage] = useState("Chargement...");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const data = await getSuperCurrencies();

      setRates(data.rates);
      setCountries(data.countries);
      setDiasporaGrid(data.diasporaGrid);

      setValues(
        Object.fromEntries(
          data.rates.map((rate) => [
            rate.currency,
            String(rate.dzdPerUnit),
          ])
        )
      );

      setMessage("");
    } catch {
      setMessage("Impossible de charger les devises diaspora.");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function getRate(currency: "EUR" | "USD") {
    return rates.find((rate) => rate.currency === currency);
  }

  async function handleSaveRate(currency: "EUR" | "USD") {
    const rate = getRate(currency);
    const dzdPerUnit = Number(values[currency]);

    if (!Number.isFinite(dzdPerUnit) || dzdPerUnit <= 0) {
      setMessage("Saisissez un taux DZD valide.");
      return;
    }

    try {
      setSaving(true);

      await saveSuperCurrencyRate(currency, {
        dzdPerUnit,
        active: rate?.active ?? true,
      });

      setMessage(`Taux ${currency} enregistré.`);
      await loadData();
    } catch {
      setMessage(`Impossible d'enregistrer le taux ${currency}.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleRate(currency: "EUR" | "USD") {
    const rate = getRate(currency);

    if (!rate) {
      setMessage(`Enregistrez d'abord le taux ${currency}.`);
      return;
    }

    try {
      setSaving(true);

      await saveSuperCurrencyRate(currency, {
        dzdPerUnit: rate.dzdPerUnit,
        active: !rate.active,
      });

      await loadData();
    } catch {
      setMessage("Impossible de modifier ce taux.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCountry(event: FormEvent) {
    event.preventDefault();

    const code = countryCode.trim().toUpperCase();
    const name = countryName.trim();

    if (!/^[A-Z]{2}$/.test(code) || !name) {
      setMessage(
        "Saisissez un code pays ISO à deux lettres et un nom de pays."
      );
      return;
    }

    try {
      setSaving(true);

      await createDiasporaCountry({
        code,
        name,
        active: true,
      });

      setCountryCode("");
      setCountryName("");
      setMessage("Pays diaspora enregistré.");
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d'enregistrer ce pays."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCountry(country: DiasporaCountry) {
    try {
      setSaving(true);

      await updateDiasporaCountry(country.code, {
        name: country.name,
        active: !country.active,
      });

      await loadData();
    } catch {
      setMessage("Impossible de modifier ce pays.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Devises et diaspora
        </h1>

        <p className="mt-4 text-foreground/70">
          La comptabilité et les réservations restent en DZD. Les taux
          servent aux équivalents affichés ; la grille diaspora utilise
          les prix configurés dans Tarifs et Packs.
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Taux EUR et USD</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {currencies.map((currency) => {
              const rate = getRate(currency);

              return (
                <article
                  key={currency}
                  className="rounded-2xl border border-foreground/15 p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold">{currency}</h3>

                    <span
                      className={
                        rate?.active
                          ? "rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                          : "rounded-full bg-foreground/10 px-3 py-1 text-sm"
                      }
                    >
                      {rate?.active ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  <label className="mt-5 block text-sm font-semibold">
                    Nombre de DZD pour 1 {currency}
                  </label>

                  <input
                    type="number"
                    min="0.000001"
                    step="0.01"
                    value={values[currency] || ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [currency]: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                  />

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveRate(currency)}
                      className="rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
                    >
                      Enregistrer
                    </button>

                    {rate ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleToggleRate(currency)}
                        className="rounded-xl border border-foreground/20 px-5 py-3 font-semibold disabled:opacity-50"
                      >
                        {rate.active ? "Désactiver" : "Activer"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Pays diaspora</h2>

          <p className="mt-3 text-foreground/70">
            Ajoutez uniquement les pays validés par votre politique
            commerciale. Le drapeau est généré depuis le code ISO.
          </p>

          <form
            onSubmit={handleCreateCountry}
            className="mt-5 grid gap-4 rounded-2xl border border-foreground/15 p-6 md:grid-cols-[160px_1fr_auto]"
          >
            <input
              required
              maxLength={2}
              value={countryCode}
              onChange={(event) =>
                setCountryCode(
                  event.target.value.toUpperCase().replace(/[^A-Z]/g, "")
                )
              }
              placeholder="DZ"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              required
              value={countryName}
              onChange={(event) => setCountryName(event.target.value)}
              placeholder="Nom du pays"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
            >
              Ajouter
            </button>
          </form>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {countries.map((country) => (
              <article
                key={country.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-foreground/15 p-4"
              >
                <p>
                  <img
  src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
  alt={`Drapeau ${country.name}`}
  className="mr-3 inline-block h-5 w-7 rounded-sm object-cover"
/>
                  <strong>{country.name}</strong>
                  <span className="ml-2 text-sm text-foreground/60">
                    {country.code}
                  </span>
                </p>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleToggleCountry(country)}
                  className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {country.active ? "Retirer" : "Réactiver"}
                </button>
              </article>
            ))}

            {countries.length === 0 ? (
              <p className="text-foreground/70">
                Aucun pays diaspora configuré.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Grille diaspora</h2>

          <p className="mt-3 text-foreground/70">
            Cette synthèse est en lecture seule. Modifiez les tarifs dans
            « Tarifs » et les packs dans « Packs ».
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-foreground/15 p-6">
              <h3 className="font-bold">Tarifs par créneau</h3>

              <div className="mt-4 space-y-3">
                {diasporaGrid?.pricingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-xl bg-foreground/5 p-3 text-sm"
                  >
                    <strong>
                      {rule.slot} · {rule.season}
                    </strong>
                    <p className="mt-1 text-foreground/70">
                      {rule.minGuests}–{rule.maxGuests} invités ·{" "}
                      {formatDZD(rule.priceDZD)}
                      {!rule.active ? " · Inactif" : ""}
                    </p>
                  </div>
                ))}

                {!diasporaGrid?.pricingRules.length ? (
                  <p className="text-foreground/70">
                    Aucun tarif diaspora configuré.
                  </p>
                ) : null}
              </div>
            </article>

            <article className="rounded-2xl border border-foreground/15 p-6">
              <h3 className="font-bold">Packs diaspora</h3>

              <div className="mt-4 space-y-3">
                {diasporaGrid?.packs.map((pack) => (
                  <div
                    key={pack.key}
                    className="rounded-xl bg-foreground/5 p-3 text-sm"
                  >
                    <strong>{pack.name.fr}</strong>
                    <p className="mt-1 text-foreground/70">
                      {pack.basePriceDZD === undefined
                        ? "Prix diaspora non configuré"
                        : `${formatDZD(pack.basePriceDZD)} · ${
                            pack.includedGuests
                          } invités inclus`}
                    </p>
                    <p className="text-foreground/70">
                      Supplément :{" "}
                      {pack.extraGuestPriceDZD === undefined
                        ? "Non configuré"
                        : formatDZD(pack.extraGuestPriceDZD)}
                      {!pack.active ? " · Inactif" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-foreground/15 p-6 lg:col-span-2">
              <h3 className="font-bold">Acompte diaspora par événement</h3>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {diasporaGrid?.eventTypes.map((eventType) => (
                  <div
                    key={eventType.key}
                    className="rounded-xl bg-foreground/5 p-3 text-sm"
                  >
                    <strong>{eventType.name.fr}</strong>
                    <p className="mt-1 text-foreground/70">
                      Acompte :{" "}
                      {eventType.depositPercent === undefined
                        ? "Non configuré"
                        : `${eventType.depositPercent}%`}
                      {!eventType.active ? " · Inactif" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        {message ? <p className="mt-6">{message}</p> : null}
      </div>
    </main>
  );
}