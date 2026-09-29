import { useEffect, useState, type FormEvent } from "react";
import {
  createCustomPackTemplate,
  createSuperPack,
  getSuperPacks,
  setCustomPackTemplateActive,
  setSuperPackActive,
  updateCustomPackTemplate,
  updateSuperPack,
  type CatalogueService,
  type CustomPackTemplate,
  type LocalizedText,
  type PackDefinition,
  type SuperPack,
} from "../../services/super-pack.service";

type EditorMode = "PACK" | "TEMPLATE";

type Draft = {
  key: string;
  name: LocalizedText;
  description: LocalizedText;
  basePriceDZD: string;
  extraGuestPriceDZD: string;
  includedGuests: string;
  diasporaBasePriceDZD: string;
  diasporaExtraGuestPriceDZD: string;
  includedItems: string[];
};

const locales = ["fr", "ar", "en"] as const;

function emptyDraft(): Draft {
  return {
    key: "",
    name: { fr: "", ar: "", en: "" },
    description: { fr: "", ar: "", en: "" },
    basePriceDZD: "",
    extraGuestPriceDZD: "",
    includedGuests: "",
    diasporaBasePriceDZD: "",
    diasporaExtraGuestPriceDZD: "",
    includedItems: [],
  };
}

function definitionToDraft(
  definition: PackDefinition,
  key = ""
): Draft {
  return {
    key,
    name: definition.name,
    description: definition.description,
    basePriceDZD: String(definition.basePriceDZD),
    extraGuestPriceDZD: String(definition.extraGuestPriceDZD),
    includedGuests: String(definition.includedGuests),
    diasporaBasePriceDZD:
      definition.diasporaBasePriceDZD === undefined
        ? ""
        : String(definition.diasporaBasePriceDZD),
    diasporaExtraGuestPriceDZD:
      definition.diasporaExtraGuestPriceDZD === undefined
        ? ""
        : String(definition.diasporaExtraGuestPriceDZD),
    includedItems: definition.includedItems,
  };
}

function draftToDefinition(draft: Draft): PackDefinition {
  return {
    name: draft.name,
    description: draft.description,
    basePriceDZD: Number(draft.basePriceDZD),
    extraGuestPriceDZD: Number(draft.extraGuestPriceDZD),
    includedGuests: Number(draft.includedGuests),
    diasporaBasePriceDZD: draft.diasporaBasePriceDZD
      ? Number(draft.diasporaBasePriceDZD)
      : undefined,
    diasporaExtraGuestPriceDZD: draft.diasporaExtraGuestPriceDZD
      ? Number(draft.diasporaExtraGuestPriceDZD)
      : undefined,
    includedItems: draft.includedItems,
  };
}

function formatDZD(value: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value);
}

function pricePerGuest(price: number, guests: number) {
  if (guests < 1) {
    return "Non applicable : aucun invité inclus";
  }

  return `${formatDZD(Math.round(price / guests))} / personne`;
}

export default function SuperPacksPage() {
  const [packs, setPacks] = useState<SuperPack[]>([]);
  const [templates, setTemplates] = useState<CustomPackTemplate[]>([]);
  const [services, setServices] = useState<CatalogueService[]>([]);
  const [message, setMessage] = useState("Chargement...");
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState<EditorMode>("PACK");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  async function loadData() {
    try {
      const data = await getSuperPacks();

      setPacks(data.packs);
      setTemplates(data.templates);
      setServices(data.services);
      setMessage("");
    } catch {
      setMessage("Impossible de charger les packs et modèles.");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function startNew(nextMode: EditorMode) {
    setMode(nextMode);
    setEditingId(null);
    setDraft(emptyDraft());
    setMessage("");
  }

  function updateText(
    field: "name" | "description",
    locale: keyof LocalizedText,
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      [field]: {
        ...current[field],
        [locale]: value,
      },
    }));
  }

  function toggleIncludedItem(serviceKey: string) {
    setDraft((current) => ({
      ...current,
      includedItems: current.includedItems.includes(serviceKey)
        ? current.includedItems.filter((item) => item !== serviceKey)
        : [...current.includedItems, serviceKey],
    }));
  }

  function editPack(pack: SuperPack) {
    setMode("PACK");
    setEditingId(pack.key);
    setDraft(definitionToDraft(pack, pack.key));
    setMessage(`Modification du pack « ${pack.name.fr} »`);
  }

  function editTemplate(template: CustomPackTemplate) {
    setMode("TEMPLATE");
    setEditingId(template.id);
    setDraft(definitionToDraft(template));
    setMessage(`Modification du modèle « ${template.name.fr} »`);
  }

  function useTemplateForPack(template: CustomPackTemplate) {
    setMode("PACK");
    setEditingId(null);
    setDraft(definitionToDraft(template));
    setMessage(
      "Modèle chargé : donnez une nouvelle clé puis créez le pack."
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);

      const values = draftToDefinition(draft);

      if (mode === "PACK") {
        if (editingId) {
          await updateSuperPack(editingId, values);
          setMessage("Pack mis à jour.");
        } else {
          await createSuperPack({
            key: draft.key,
            ...values,
          });
          setMessage("Pack créé.");
        }
      } else if (editingId) {
        await updateCustomPackTemplate(editingId, values);
        setMessage("Modèle personnalisé mis à jour.");
      } else {
        await createCustomPackTemplate(values);
        setMessage("Modèle personnalisé créé.");
      }

      await loadData();
      setEditingId(null);
      setDraft(emptyDraft());
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d’enregistrer cette configuration."
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePack(pack: SuperPack) {
    try {
      await setSuperPackActive(pack.key, !pack.active);
      await loadData();
    } catch {
      setMessage("Impossible de modifier le statut du pack.");
    }
  }

  async function toggleTemplate(template: CustomPackTemplate) {
    try {
      await setCustomPackTemplateActive(template.id, !template.active);
      await loadData();
    } catch {
      setMessage("Impossible de modifier le statut du modèle.");
    }
  }

  const title =
    mode === "PACK"
      ? editingId
        ? "Modifier un pack"
        : "Créer un pack"
      : editingId
        ? "Modifier un modèle personnalisé"
        : "Créer un modèle personnalisé";

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Packs et custom</h1>

        <p className="mt-3 text-foreground/70">
          Les modifications concernent uniquement les prochains devis et
          réservations. Les montants historiques restent inchangés.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => startNew("PACK")}
            className={
              mode === "PACK"
                ? "rounded-xl bg-gold px-5 py-3 font-semibold text-black"
                : "rounded-xl border border-foreground/20 px-5 py-3 font-semibold"
            }
          >
            Nouveau pack
          </button>

          <button
            type="button"
            onClick={() => startNew("TEMPLATE")}
            className={
              mode === "TEMPLATE"
                ? "rounded-xl bg-gold px-5 py-3 font-semibold text-black"
                : "rounded-xl border border-foreground/20 px-5 py-3 font-semibold"
            }
          >
            Nouveau modèle custom
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-foreground/15 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">{title}</h2>

            {editingId ? (
              <button
                type="button"
                onClick={() => startNew(mode)}
                className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold"
              >
                Annuler la modification
              </button>
            ) : null}
          </div>

          {mode === "PACK" ? (
            <label className="mt-6 block">
              <span className="text-sm font-semibold">Clé du pack</span>
              <input
                required
                disabled={Boolean(editingId)}
                value={draft.key}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    key: event.target.value,
                  }))
                }
                placeholder="Ex. mariage-premium"
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3 disabled:opacity-60"
              />
              <span className="mt-2 block text-xs text-foreground/60">
                Minuscules, chiffres et tirets uniquement. La clé ne change
                pas après création.
              </span>
            </label>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {locales.map((locale) => (
              <label key={`name-${locale}`}>
                <span className="text-sm font-semibold">
                  Nom {locale.toUpperCase()}
                </span>
                <input
                  required
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  value={draft.name[locale]}
                  onChange={(event) =>
                    updateText("name", locale, event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                />
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {locales.map((locale) => (
              <label key={`description-${locale}`}>
                <span className="text-sm font-semibold">
                  Description {locale.toUpperCase()}
                </span>
                <textarea
                  required
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  value={draft.description[locale]}
                  onChange={(event) =>
                    updateText("description", locale, event.target.value)
                  }
                  className="mt-2 min-h-28 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                />
              </label>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold">Invités inclus</span>
              <input
                required
                type="number"
                min="0"
                value={draft.includedGuests}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    includedGuests: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>

            <label>
              <span className="text-sm font-semibold">
                Prix de base résident (DZD)
              </span>
              <input
                required
                type="number"
                min="0"
                value={draft.basePriceDZD}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    basePriceDZD: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>

            <label>
              <span className="text-sm font-semibold">
                Supplément résident / invité (DZD)
              </span>
              <input
                required
                type="number"
                min="0"
                value={draft.extraGuestPriceDZD}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    extraGuestPriceDZD: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>

            <label>
              <span className="text-sm font-semibold">
                Prix de base diaspora (DZD)
              </span>
              <input
                type="number"
                min="0"
                value={draft.diasporaBasePriceDZD}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    diasporaBasePriceDZD: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>

            <label>
              <span className="text-sm font-semibold">
                Supplément diaspora / invité (DZD)
              </span>
              <input
                type="number"
                min="0"
                value={draft.diasporaExtraGuestPriceDZD}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    diasporaExtraGuestPriceDZD: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />
            </label>
          </div>

          <section className="mt-8">
            <h3 className="font-semibold">Inclusions du catalogue</h3>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {services.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center gap-3 rounded-xl border border-foreground/15 p-3"
                >
                  <input
                    type="checkbox"
                    checked={draft.includedItems.includes(service.key)}
                    onChange={() => toggleIncludedItem(service.key)}
                  />

                  <span>
                    <strong>{service.name.fr}</strong>
                    <span className="block text-xs text-foreground/60">
                      {service.key} · {service.category}
                      {service.priceDZD !== undefined
                        ? ` · ${formatDZD(service.priceDZD)}`
                        : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="mt-8 rounded-xl bg-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>

        {message ? <p className="mt-6">{message}</p> : null}

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Packs</h2>

          <div className="mt-5 space-y-4">
            {packs.map((pack) => (
              <article
                key={pack.id}
                className="rounded-2xl border border-foreground/15 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold">
                      {pack.name.fr} · {pack.key}
                    </h3>

                    <p className="mt-2 text-sm text-foreground/70">
                      {pack.includedGuests} invités inclus ·{" "}
                      {formatDZD(pack.basePriceDZD)} ·{" "}
                      {pricePerGuest(
                        pack.basePriceDZD,
                        pack.includedGuests
                      )}
                    </p>

                    {pack.diasporaBasePriceDZD !== undefined ? (
                      <p className="mt-1 text-sm text-foreground/70">
                        Diaspora : {formatDZD(pack.diasporaBasePriceDZD)} ·{" "}
                        {pricePerGuest(
                          pack.diasporaBasePriceDZD,
                          pack.includedGuests
                        )}
                      </p>
                    ) : null}

                    <p className="mt-2 text-sm text-foreground/70">
                      Inclusions :{" "}
                      {pack.includedItems.length > 0
                        ? pack.includedItems.join(", ")
                        : "Aucune"}
                    </p>
                  </div>

                  <span
                    className={
                      pack.active
                        ? "rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                        : "rounded-full bg-foreground/10 px-3 py-1 text-sm"
                    }
                  >
                    {pack.active ? "Actif" : "Archivé"}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => editPack(pack)}
                    className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black"
                  >
                    Modifier
                  </button>

                  <button
                    type="button"
                    onClick={() => void togglePack(pack)}
                    className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold"
                  >
                    {pack.active ? "Archiver" : "Réactiver"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Modèles personnalisés</h2>

          <div className="mt-5 space-y-4">
            {templates.map((template) => (
              <article
                key={template.id}
                className="rounded-2xl border border-foreground/15 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{template.name.fr}</h3>

                    <p className="mt-2 text-sm text-foreground/70">
                      {template.includedGuests} invités inclus ·{" "}
                      {formatDZD(template.basePriceDZD)} ·{" "}
                      {pricePerGuest(
                        template.basePriceDZD,
                        template.includedGuests
                      )}
                    </p>

                    <p className="mt-2 text-sm text-foreground/70">
                      Inclusions :{" "}
                      {template.includedItems.length > 0
                        ? template.includedItems.join(", ")
                        : "Aucune"}
                    </p>
                  </div>

                  <span
                    className={
                      template.active
                        ? "rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                        : "rounded-full bg-foreground/10 px-3 py-1 text-sm"
                    }
                  >
                    {template.active ? "Actif" : "Archivé"}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => useTemplateForPack(template)}
                    className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black"
                  >
                    Créer un pack depuis ce modèle
                  </button>

                  <button
                    type="button"
                    onClick={() => editTemplate(template)}
                    className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold"
                  >
                    Modifier
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleTemplate(template)}
                    className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold"
                  >
                    {template.active ? "Archiver" : "Réactiver"}
                  </button>
                </div>
              </article>
            ))}

            {templates.length === 0 ? (
              <p className="text-foreground/70">
                Aucun modèle personnalisé n’a encore été créé.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}