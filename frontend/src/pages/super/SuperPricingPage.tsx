import { useEffect, useState, type FormEvent } from "react";
import {
  createPricingRule,
  createPricingSeason,
  deletePricingRule,
  deletePricingSeason,
  getSuperPricing,
  setPricingRuleActive,
  setPricingSeasonActive,
  type PricingEventType,
  type PricingRule,
  type PricingSeason,
  updateEventTypeCapacity,
} from "../../services/super-pricing.service";

const slots = ["AFTERNOON", "EVENING", "NIGHT", "DAY"];

export default function SuperPricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [seasons, setSeasons] = useState<PricingSeason[]>([]);
  const [eventTypes, setEventTypes] = useState<PricingEventType[]>([]);
  const [message, setMessage] = useState("");

  const [ruleForm, setRuleForm] = useState({
    market: "RESIDENT" as "RESIDENT" | "DIASPORA",
    slot: "EVENING" as PricingRule["slot"],
    season: "NORMAL" as PricingRule["season"],
    dayType: "ALL" as PricingRule["dayType"],
    minGuests: "1",
    maxGuests: "100",
    priceDZD: "",
  });

  const [seasonForm, setSeasonForm] = useState({
    key: "HIGH" as "LOW" | "HIGH",
    startMonthDay: "",
    endMonthDay: "",
    priority: "0",
  });

  async function loadData() {
    try {
      const data = await getSuperPricing();
      setRules(data.pricingRules);
      setSeasons(data.pricingSeasons);
      setEventTypes(data.eventTypes);
      setMessage("");
    } catch {
      setMessage("Impossible de charger la configuration tarifaire.");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleCreateRule(event: FormEvent) {
    event.preventDefault();

    try {
      await createPricingRule({
        market: ruleForm.market,
        slot: ruleForm.slot,
        season: ruleForm.season,
        dayType: ruleForm.dayType,
        minGuests: Number(ruleForm.minGuests),
        maxGuests: Number(ruleForm.maxGuests),
        priceDZD: Number(ruleForm.priceDZD),
      });

      setRuleForm({ ...ruleForm, priceDZD: "" });
      setMessage("Règle tarifaire créée.");
      await loadData();
    } catch {
      setMessage("Impossible de créer la règle tarifaire.");
    }
  }

  async function handleCreateSeason(event: FormEvent) {
    event.preventDefault();

    try {
      await createPricingSeason({
        key: seasonForm.key,
        startMonthDay: seasonForm.startMonthDay,
        endMonthDay: seasonForm.endMonthDay,
        priority: Number(seasonForm.priority),
      });

      setSeasonForm({
        key: "HIGH",
        startMonthDay: "",
        endMonthDay: "",
        priority: "0",
      });

      setMessage("Saison créée.");
      await loadData();
    } catch {
      setMessage("Impossible de créer la saison.");
    }
  }

  async function saveCapacity(eventType: PricingEventType) {
    try {
      await updateEventTypeCapacity(eventType.key, {
        womenCapacity: eventType.womenCapacity,
        menCapacity: eventType.menCapacity,
        bufferMinutes: eventType.bufferMinutes || 0,
        allowedSlots: eventType.allowedSlots,
      });

      setMessage(`Configuration ${eventType.name.fr} enregistrée.`);
      await loadData();
    } catch {
      setMessage("Impossible d’enregistrer la capacité.");
    }
  }

  function updateEventType(
    key: string,
    values: Partial<PricingEventType>
  ) {
    setEventTypes((current) =>
      current.map((eventType) =>
        eventType.key === key ? { ...eventType, ...values } : eventType
      )
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Tarifs et saisons</h1>

        {message ? <p className="mt-6">{message}</p> : null}

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Nouvelle règle tarifaire</h2>

          <form
            onSubmit={handleCreateRule}
            className="mt-5 grid gap-4 md:grid-cols-3"
          >
            <select
              value={ruleForm.market}
              onChange={(event) =>
                setRuleForm({
                  ...ruleForm,
                  market: event.target.value as "RESIDENT" | "DIASPORA",
                })
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="RESIDENT">Résident</option>
              <option value="DIASPORA">Diaspora</option>
            </select>

            <select
              value={ruleForm.slot}
              onChange={(event) =>
                setRuleForm({
                  ...ruleForm,
                  slot: event.target.value as PricingRule["slot"],
                })
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>

            <select
              value={ruleForm.season}
              onChange={(event) =>
                setRuleForm({
                  ...ruleForm,
                  season: event.target.value as PricingRule["season"],
                })
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="LOW">Basse saison</option>
              <option value="NORMAL">Saison normale</option>
              <option value="HIGH">Haute saison</option>
            </select>

            <select
              value={ruleForm.dayType}
              onChange={(event) =>
                setRuleForm({
                  ...ruleForm,
                  dayType: event.target.value as PricingRule["dayType"],
                })
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="ALL">Tous les jours</option>
              <option value="WEEKDAY">Semaine</option>
              <option value="WEEKEND">Week-end</option>
            </select>

            <input
              type="number"
              min="1"
              value={ruleForm.minGuests}
              onChange={(event) =>
                setRuleForm({ ...ruleForm, minGuests: event.target.value })
              }
              placeholder="Invités minimum"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              type="number"
              min="1"
              value={ruleForm.maxGuests}
              onChange={(event) =>
                setRuleForm({ ...ruleForm, maxGuests: event.target.value })
              }
              placeholder="Invités maximum"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              required
              type="number"
              min="0"
              value={ruleForm.priceDZD}
              onChange={(event) =>
                setRuleForm({ ...ruleForm, priceDZD: event.target.value })
              }
              placeholder="Prix DZD"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="submit"
              className="rounded-xl bg-gold px-5 py-3 font-semibold text-black"
            >
              Ajouter la règle
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Saisons</h2>

          <form
            onSubmit={handleCreateSeason}
            className="mt-5 grid gap-4 md:grid-cols-4"
          >
            <select
              value={seasonForm.key}
              onChange={(event) =>
                setSeasonForm({
                  ...seasonForm,
                  key: event.target.value as "LOW" | "HIGH",
                })
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="HIGH">Haute saison</option>
              <option value="LOW">Basse saison</option>
            </select>

            <input
              required
              type="text"
              pattern="\d{2}-\d{2}"
              value={seasonForm.startMonthDay}
              onChange={(event) =>
                setSeasonForm({
                  ...seasonForm,
                  startMonthDay: event.target.value,
                })
              }
              placeholder="Début MM-JJ"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              required
              type="text"
              pattern="\d{2}-\d{2}"
              value={seasonForm.endMonthDay}
              onChange={(event) =>
                setSeasonForm({
                  ...seasonForm,
                  endMonthDay: event.target.value,
                })
              }
              placeholder="Fin MM-JJ"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="submit"
              className="rounded-xl bg-gold px-5 py-3 font-semibold text-black"
            >
              Ajouter la saison
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Capacité et buffer</h2>

          <div className="mt-5 space-y-5">
            {eventTypes.map((eventType) => (
              <article
                key={eventType.id}
                className="rounded-xl border border-foreground/15 p-5"
              >
                <h3 className="font-bold">{eventType.name.fr}</h3>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <input
                    type="number"
                    min="0"
                    value={eventType.womenCapacity}
                    onChange={(event) =>
                      updateEventType(eventType.key, {
                        womenCapacity: Number(event.target.value),
                      })
                    }
                    placeholder="Capacité femmes"
                    className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                  />

                  <input
                    type="number"
                    min="0"
                    value={eventType.menCapacity}
                    onChange={(event) =>
                      updateEventType(eventType.key, {
                        menCapacity: Number(event.target.value),
                      })
                    }
                    placeholder="Capacité hommes"
                    className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                  />

                  <input
                    type="number"
                    min="0"
                    value={eventType.bufferMinutes || 0}
                    onChange={(event) =>
                      updateEventType(eventType.key, {
                        bufferMinutes: Number(event.target.value),
                      })
                    }
                    placeholder="Buffer en minutes"
                    className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {slots.map((slot) => (
                    <label
                      key={slot}
                      className="flex items-center gap-2 rounded-xl border border-foreground/20 px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={eventType.allowedSlots.includes(slot)}
                        onChange={() =>
                          updateEventType(eventType.key, {
                            allowedSlots: eventType.allowedSlots.includes(slot)
                              ? eventType.allowedSlots.filter(
                                  (item) => item !== slot
                                )
                              : [...eventType.allowedSlots, slot],
                          })
                        }
                      />
                      {slot}
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => void saveCapacity(eventType)}
                  className="mt-5 rounded-xl bg-black px-5 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
                >
                  Enregistrer
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Règles existantes</h2>

          <div className="mt-5 space-y-3">
            {rules.map((rule) => (
              <article
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-foreground/15 p-4"
              >
                <p>
                  {rule.market} · {rule.slot} · {rule.season} ·{" "}
                  {rule.dayType} · {rule.minGuests}-{rule.maxGuests} invités ·{" "}
                  {rule.priceDZD} DZD
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void setPricingRuleActive(rule.id, !rule.active).then(
                        loadData
                      )
                    }
                    className="rounded-xl border border-foreground/20 px-4 py-2"
                  >
                    {rule.active ? "Désactiver" : "Activer"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void deletePricingRule(rule.id).then(loadData)}
                    className="rounded-xl border border-red-700 px-4 py-2 text-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-bold">Saisons existantes</h2>

          <div className="mt-5 space-y-3">
            {seasons.map((season) => (
              <article
                key={season.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-foreground/15 p-4"
              >
                <p>
                  {season.key} · {season.startMonthDay} → {season.endMonthDay}
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void setPricingSeasonActive(
                        season.id,
                        !season.active
                      ).then(loadData)
                    }
                    className="rounded-xl border border-foreground/20 px-4 py-2"
                  >
                    {season.active ? "Désactiver" : "Activer"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void deletePricingSeason(season.id).then(loadData)
                    }
                    className="rounded-xl border border-red-700 px-4 py-2 text-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}