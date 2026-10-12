import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAdminBookingDetails,
  getAssignableAgents,
  sendAdminProForma,
  updateAdminBooking,
  type AdminBookingDetails,
  type AssignableAgent,
} from "../../services/admin-booking.service";

const slots = [
  { value: "AFTERNOON", label: "Après-midi" },
  { value: "EVENING", label: "Soir" },
  { value: "NIGHT", label: "Nuit" },
  { value: "DAY", label: "Journée" },
] as const;

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminBookingDetailsPage() {
  const { id } = useParams();

  const [booking, setBooking] = useState<AdminBookingDetails | null>(null);
  const [agents, setAgents] = useState<AssignableAgent[]>([]);
  const [assignedAgentId, setAssignedAgentId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [slot, setSlot] = useState<
    "AFTERNOON" | "EVENING" | "NIGHT" | "DAY"
  >("EVENING");
  const [overrideAmount, setOverrideAmount] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("Chargement du dossier...");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    if (!id) {
      return;
    }

    try {
      const [bookingData, agentData] = await Promise.all([
        getAdminBookingDetails(id),
        getAssignableAgents(),
      ]);

      setBooking(bookingData);
      setAgents(agentData);
      setAssignedAgentId(bookingData.assignedAgent?.id || "");
      setAdminNotes(bookingData.adminNotes);
      setSlot(bookingData.slot);
      setOverrideAmount(
        bookingData.priceOverrideDZD?.toString() || ""
      );
      setOverrideReason(bookingData.priceOverrideReason);
      setRecipientEmail(bookingData.client?.email || "");
      setMessage("");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de charger le dossier."
      );
    }
  }

  useEffect(() => {
    void loadData();
  }, [id]);

  async function saveNotesAndAgent() {
    if (!id) {
      return;
    }

    try {
      setLoading(true);

      const result = await updateAdminBooking(id, {
        assignedAgentId,
        adminNotes,
      });

      setMessage(result.message);
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de mettre à jour le dossier."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveSlot() {
    if (!id) {
      return;
    }

    try {
      setLoading(true);

      const result = await updateAdminBooking(id, { slot });

      setMessage(result.message);
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de modifier le créneau."
      );
    } finally {
      setLoading(false);
    }
  }

  async function savePriceOverride() {
    if (!id) {
      return;
    }

    const amount = Number(overrideAmount);

    if (!Number.isFinite(amount) || amount < 0 || !overrideReason.trim()) {
      setMessage("Saisissez un montant valide et un motif obligatoire.");
      return;
    }

    try {
      setLoading(true);

      const result = await updateAdminBooking(id, {
        priceOverrideDZD: amount,
        priceOverrideReason: overrideReason.trim(),
      });

      setMessage(result.message);
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de modifier le prix."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSendProForma() {
    if (!id || !recipientEmail.trim()) {
      setMessage("Saisissez l’adresse email du destinataire.");
      return;
    }

    try {
      setLoading(true);

      const result = await sendAdminProForma(id, recipientEmail.trim());

      setMessage(`${result.message} : ${result.proFormaNumber}`);
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d'envoyer le pro forma."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!booking && message === "Chargement du dossier...") {
    return <main className="p-10">Chargement du dossier...</main>;
  }

  if (!booking) {
    return (
      <main className="p-10">
        <p className="text-red-700">{message}</p>
      </main>
    );
  }

  const priceLocked =
  !["DRAFT", "PRICED", "OTP_PENDING", "HELD"].includes(booking.status);

const slotLocked =
  Boolean(booking.proForma) || booking.status !== "HELD";

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/admin/reservations"
          className="text-sm font-semibold underline"
        >
          ← Réservations
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Dossier réservation
        </h1>

        <p className="mt-3 text-foreground/70">
          {booking.eventDate} · {booking.slot} · {booking.eventTypeKey}
        </p>

        {message && (
          <p className="mt-6 rounded-xl bg-foreground/5 p-4">
            {message}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-foreground/15 p-6">
            <h2 className="text-2xl font-bold">Client et événement</h2>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-foreground/60">Client</dt>
                <dd className="mt-1 font-semibold">
                  {booking.client?.name || "Client invité"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-foreground/60">Contact</dt>
                <dd className="mt-1 font-semibold">
                  {booking.client?.phone ||
                    booking.guestPhone ||
                    booking.client?.email ||
                    "—"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-foreground/60">Invités</dt>
                <dd className="mt-1 font-semibold">
                  {booking.womenGuests} femmes · {booking.menGuests} hommes
                </dd>
              </div>

              <div>
                <dt className="text-sm text-foreground/60">Statut</dt>
                <dd className="mt-1 font-semibold text-gold">
                  {booking.status}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-foreground/60">Marché</dt>
                <dd className="mt-1 font-semibold">
                  {booking.pricingMarket === "DIASPORA"
                    ? "Diaspora"
                    : "Résidence DZ"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-foreground/60">Pack</dt>
                <dd className="mt-1 font-semibold">
                  {booking.packKey || "Aucun"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-foreground/15 p-6">
            <h2 className="text-2xl font-bold">Montants</h2>

            <dl className="mt-5 space-y-4">
              <div className="flex justify-between gap-4">
                <dt className="text-foreground/60">Total</dt>
                <dd className="font-semibold">
                  {formatDZD(booking.totalDZD)}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-foreground/60">Acompte</dt>
                <dd className="font-semibold text-gold">
                  {formatDZD(booking.depositDZD)}
                </dd>
              </div>

              {booking.priceOverrideDZD !== undefined && (
                <div>
                  <dt className="text-sm text-foreground/60">
                    Override appliqué
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {formatDZD(booking.priceOverrideDZD)}
                  </dd>
                  <p className="mt-1 text-sm text-foreground/70">
                    {booking.priceOverrideReason}
                  </p>
                </div>
              )}
            </dl>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Traitement interne</h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold">Agent assigné</span>

              <select
                value={assignedAgentId}
                onChange={(event) => setAssignedAgentId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              >
                <option value="">Non attribué</option>

                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} · {agent.role}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold">
                Créneau
              </span>

              <select
                value={slot}
                disabled={loading || slotLocked}
                onChange={(event) =>
                  setSlot(
                    event.target.value as
                      | "AFTERNOON"
                      | "EVENING"
                      | "NIGHT"
                      | "DAY"
                  )
                }
                className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3 disabled:opacity-50"
              >
                {slots.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={
                   loading ||
                   slotLocked ||
                   slot === booking.slot
                }
                onClick={() => void saveSlot()}
                className="mt-3 rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Modifier le créneau
              </button>
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold">Notes internes</span>

            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              maxLength={3000}
              className="mt-2 min-h-32 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />
          </label>

          <button
            type="button"
            disabled={loading}
            onClick={() => void saveNotesAndAgent()}
            className="mt-4 rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
          >
            Enregistrer notes et agent
          </button>
        </section>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Override de prix</h2>

           {priceLocked ? (
            <p className="mt-4 text-foreground/70">
  {booking.proForma
    ? `Le prix ne peut plus être modifié car le pro forma ${booking.proForma.number} existe déjà.`
    : "Le prix peut uniquement être modifié pendant le hold, avant le dépôt d’une preuve de paiement."}
</p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <input
                type="number"
                min="0"
                value={overrideAmount}
                onChange={(event) => setOverrideAmount(event.target.value)}
                placeholder="Nouveau total DZD"
                className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />

              <input
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
                maxLength={1000}
                placeholder="Motif obligatoire"
                className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() => void savePriceOverride()}
                className="rounded-xl bg-gold px-5 py-3 font-semibold text-black disabled:opacity-50"
              >
                Appliquer l’override
              </button>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
          <h2 className="text-2xl font-bold">Pro forma</h2>

          {booking.proForma ? (
            <p className="mt-3 text-foreground/70">
              Pro forma existant :{" "}
              <strong>{booking.proForma.number}</strong>
            </p>
          ) : (
            <p className="mt-3 text-foreground/70">
              Le pro forma sera créé avec le prix actuel lors du premier envoi.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <input
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="Email du destinataire"
              className="min-w-72 rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <button
              type="button"
              disabled={loading}
              onClick={() => void handleSendProForma()}
              className="rounded-xl bg-black px-5 py-3 font-semibold text-ivory dark:bg-gold dark:text-black disabled:opacity-50"
            >
              Envoyer le pro forma
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}