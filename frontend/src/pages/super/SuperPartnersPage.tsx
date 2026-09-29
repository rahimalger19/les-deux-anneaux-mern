import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  createSuperPartner,
  getSuperPartners,
  reorderSuperPartners,
  setSuperPartnerActive,
  updateSuperPartner,
  type PartnerCategory,
  type PartnerInput,
  type SuperPartner,
} from "../../services/super-partner.service";

type PartnerForm = {
  name: string;
  category: PartnerCategory;
  logoUrl: string;
  websiteUrl: string;
  promoCode: string;
  displayOrder: string;
};

function emptyForm(): PartnerForm {
  return {
    name: "",
    category: "CATERER",
    logoUrl: "",
    websiteUrl: "",
    promoCode: "",
    displayOrder: "0",
  };
}

function partnerToForm(partner: SuperPartner): PartnerForm {
  return {
    name: partner.name,
    category: partner.category,
    logoUrl: partner.logoUrl,
    websiteUrl: partner.websiteUrl,
    promoCode: partner.promoCode || "",
    displayOrder: String(partner.displayOrder),
  };
}

export default function SuperPartnersPage() {
  const [partners, setPartners] = useState<SuperPartner[]>([]);
  const [message, setMessage] = useState("Chargement...");
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      setPartners(await getSuperPartners());
      setMessage("");
    } catch {
      setMessage("Impossible de charger les partenaires.");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);

      const data: PartnerInput = {
        name: form.name,
        category: form.category,
        logoUrl: form.logoUrl,
        websiteUrl: form.websiteUrl,
        promoCode: form.promoCode.trim() || undefined,
        displayOrder: Number(form.displayOrder),
      };

      if (editingId) {
        await updateSuperPartner(editingId, data);
        setMessage("Partenaire mis à jour.");
      } else {
        await createSuperPartner(data);
        setMessage("Partenaire créé.");
      }

      resetForm();
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d’enregistrer le partenaire."
      );
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(partner: SuperPartner) {
    setEditingId(partner.id);
    setForm(partnerToForm(partner));
    setMessage(`Modification de « ${partner.name} »`);
  }

  async function togglePartner(partner: SuperPartner) {
    try {
      await setSuperPartnerActive(partner.id, !partner.active);

      setMessage(
        partner.active
          ? "Partenaire archivé."
          : "Partenaire réactivé."
      );

      await loadData();
    } catch {
      setMessage("Impossible de modifier ce partenaire.");
    }
  }

  async function movePartner(
    partnerId: string,
    direction: "UP" | "DOWN"
  ) {
    const activePartners = partners.filter((partner) => partner.active);
    const currentIndex = activePartners.findIndex(
      (partner) => partner.id === partnerId
    );

    const targetIndex =
      direction === "UP" ? currentIndex - 1 : currentIndex + 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= activePartners.length
    ) {
      return;
    }

    const reordered = [...activePartners];

    [reordered[currentIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[currentIndex],
    ];

    try {
      await reorderSuperPartners(
        reordered.map((partner) => partner.id)
      );

      setMessage("Ordre de la page d’accueil enregistré.");
      await loadData();
    } catch {
      setMessage("Impossible de modifier l’ordre des partenaires.");
    }
  }

  const activePartners = partners.filter((partner) => partner.active);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Partenaires</h1>

        <p className="mt-4 text-foreground/70">
          Gérez les partenaires publiés sur la page d’accueil, leurs
          clics sortants et leur code promo v1.1.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-foreground/15 p-6 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold">
              {editingId
                ? "Modifier un partenaire"
                : "Ajouter un partenaire"}
            </h2>
          </div>

          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
            placeholder="Nom"
            className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          />

          <select
            value={form.category}
            onChange={(event) =>
              setForm({
                ...form,
                category: event.target.value as PartnerCategory,
              })
            }
            className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          >
            <option value="CATERER">Traiteur</option>
            <option value="DECOR">Décoration</option>
            <option value="PHOTO">Photo</option>
            <option value="DJ">DJ</option>
            <option value="HOTEL">Hôtel</option>
          </select>

          <input
            required
            type="url"
            value={form.logoUrl}
            onChange={(event) =>
              setForm({ ...form, logoUrl: event.target.value })
            }
            placeholder="URL du logo"
            className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          />

          <input
            required
            type="url"
            value={form.websiteUrl}
            onChange={(event) =>
              setForm({ ...form, websiteUrl: event.target.value })
            }
            placeholder="URL du site partenaire"
            className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          />

          <input
            value={form.promoCode}
            onChange={(event) =>
              setForm({
                ...form,
                promoCode: event.target.value.toUpperCase(),
              })
            }
            placeholder="Code promo v1.1, optionnel"
            className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          />

          <input
            required
            type="number"
            min="0"
            value={form.displayOrder}
            onChange={(event) =>
              setForm({
                ...form,
                displayOrder: event.target.value,
              })
            }
            placeholder="Ordre initial"
            className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          />

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
            >
              {saving
                ? "Enregistrement..."
                : editingId
                  ? "Enregistrer"
                  : "Ajouter"}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-foreground/20 px-5 py-3 font-semibold"
              >
                Annuler
              </button>
            ) : null}
          </div>
        </form>

        {message ? <p className="mt-6">{message}</p> : null}

        <section className="mt-12">
          <h2 className="text-2xl font-bold">
            Ordre de la page d’accueil
          </h2>

          <p className="mt-3 text-foreground/70">
            Les partenaires actifs sont affichés dans cet ordre sur la
            page publique.
          </p>

          <div className="mt-5 space-y-4">
            {activePartners.map((partner, index) => (
              <article
                key={partner.id}
                className="flex flex-wrap items-center gap-5 rounded-2xl border border-foreground/15 p-5"
              >
                <span className="rounded-full bg-gold px-3 py-1 text-sm font-bold text-black">
                  {index + 1}
                </span>

                <img
                  src={partner.logoUrl}
                  alt={partner.name}
                  className="h-16 w-24 object-contain"
                />

                <div className="min-w-48 flex-1">
                  <p className="font-semibold">{partner.name}</p>
                  <p className="text-sm text-foreground/65">
                    {partner.category} · Clics : {partner.clickCount}
                  </p>

                  {partner.promoCode ? (
                    <p className="mt-1 text-sm text-gold">
                      Code promo : {partner.promoCode}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => void movePartner(partner.id, "UP")}
                    className="rounded-xl border border-foreground/20 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    disabled={index === activePartners.length - 1}
                    onClick={() => void movePartner(partner.id, "DOWN")}
                    className="rounded-xl border border-foreground/20 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    onClick={() => beginEdit(partner)}
                    className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold"
                  >
                    Modifier
                  </button>

                  <button
                    type="button"
                    onClick={() => void togglePartner(partner)}
                    className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold"
                  >
                    Archiver
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Partenaires archivés</h2>

          <div className="mt-5 space-y-4">
            {partners
              .filter((partner) => !partner.active)
              .map((partner) => (
                <article
                  key={partner.id}
                  className="flex flex-wrap items-center gap-5 rounded-2xl border border-foreground/15 p-5 opacity-70"
                >
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="h-16 w-24 object-contain"
                  />

                  <div className="flex-1">
                    <p className="font-semibold">{partner.name}</p>
                    <p className="text-sm text-foreground/65">
                      {partner.category} · Clics : {partner.clickCount}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void togglePartner(partner)}
                    className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold"
                  >
                    Réactiver
                  </button>
                </article>
              ))}

            {partners.every((partner) => partner.active) ? (
              <p className="text-foreground/65">
                Aucun partenaire archivé.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}