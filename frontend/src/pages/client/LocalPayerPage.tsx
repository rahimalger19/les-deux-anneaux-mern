import { useEffect, useState } from "react";
import {
  getMyBookings,
  type ClientBooking,
} from "../../services/client-booking.service";
import {
  createMyLocalPayer,
  getMyLocalPayers,
  removeMyLocalPayer,
  type LocalPayer,
} from "../../services/local-payer.service";
import type { PaymentMethod } from "../../services/client-payment.service";

export default function LocalPayerPage() {
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [payers, setPayers] = useState<LocalPayer[]>([]);
  const [form, setForm] = useState({
    bookingId: "",
    name: "",
    phone: "",
    relationship: "",
    paymentMethod: "CCP" as PaymentMethod,
  });
  const [message, setMessage] = useState("");

  async function loadData() {
    const [bookingData, payerData] = await Promise.all([
      getMyBookings(),
      getMyLocalPayers(),
    ]);

    setBookings(
      bookingData.filter(
        (booking) => booking.pricingMarket === "DIASPORA"
      )
    );

    setPayers(payerData);
  }

  useEffect(() => {
    loadData().catch(() =>
      setMessage("Impossible de charger les payeurs.")
    );
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      await createMyLocalPayer(form);

      setForm({
        bookingId: "",
        name: "",
        phone: "",
        relationship: "",
        paymentMethod: "CCP",
      });

      setMessage("Payeur local enregistré.");
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d'enregistrer le payeur."
      );
    }
  }

  async function handleRemove(payerId: string) {
    await removeMyLocalPayer(payerId);
    await loadData();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Payeur / proche</h1>

        <p className="mt-4 text-foreground/70">
          Pour une réservation diaspora, vous pouvez désigner un proche
          en Algérie comme payeur local.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-foreground/15 p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <select
              required
              value={form.bookingId}
              onChange={(event) =>
                setForm({ ...form, bookingId: event.target.value })
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="">Choisir une réservation diaspora</option>

              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.eventTypeKey} — {booking.eventDate}
                </option>
              ))}
            </select>

            <select
              value={form.paymentMethod}
              onChange={(event) =>
                setForm({
                  ...form,
                  paymentMethod: event.target.value as PaymentMethod,
                })
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="CCP">CCP</option>
              <option value="BARIDIMOB">BaridiMob</option>
              <option value="VIREMENT">Virement</option>
            </select>

            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Nom du proche"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              required
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
              placeholder="Téléphone du proche"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              required
              value={form.relationship}
              onChange={(event) =>
                setForm({ ...form, relationship: event.target.value })
              }
              placeholder="Lien avec vous"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3 md:col-span-2"
            />
          </div>

          <button
            type="submit"
            className="mt-6 rounded-xl bg-gold px-6 py-3 font-semibold text-black"
          >
            Enregistrer le payeur
          </button>
        </form>

        {message && <p className="mt-6">{message}</p>}

        <section className="mt-10 space-y-4">
          {payers.map((payer) => (
            <article
              key={payer._id}
              className="rounded-2xl border border-foreground/15 p-6"
            >
              <p className="font-semibold">{payer.name}</p>
              <p className="mt-2 text-foreground/70">
                {payer.relationship} · {payer.phone}
              </p>
              <p className="mt-2 text-gold">
                {payer.paymentMethod}
              </p>

              <button
                type="button"
                onClick={() => void handleRemove(payer._id)}
                className="mt-5 rounded-xl border border-red-700 px-4 py-2 text-sm font-semibold text-red-700"
              >
                Retirer
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}