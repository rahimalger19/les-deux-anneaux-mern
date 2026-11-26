import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createMyPayment,
  getMyPayments,
  type ClientPayment,
  type PaymentMethod,
} from "../../services/client-payment.service";
import {
  getMyBookings,
  type ClientBooking,
} from "../../services/client-booking.service";
import {
  getMyLocalPayers,
  type LocalPayer,
} from "../../services/local-payer.service";

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [methods, setMethods] = useState<Record<string, PaymentMethod>>({});
  const [references, setReferences] = useState<Record<string, string>>({});
  const [payers, setPayers] = useState<LocalPayer[]>([]);
const [payerIds, setPayerIds] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Chargement des paiements...");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function loadData() {
    try {
      const [paymentData, bookingData, payerData] = await Promise.all([
  getMyPayments(),
  getMyBookings(),
  getMyLocalPayers(),
]);

      setPayments(paymentData);
      setBookings(bookingData);
      setPayers(payerData);
      setMessage("");
    } catch {
      setMessage("Impossible de charger vos paiements.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreatePayment(bookingId: string) {
    const reference = references[bookingId]?.trim();

if (!reference) {
  setMessage("Saisissez la référence du paiement.");
  return;
}
    try {
      setLoadingId(bookingId);

      await createMyPayment(
  bookingId,
  methods[bookingId] || "CCP",
  reference,
  payerIds[bookingId] || undefined
);

      await loadData();
    } catch (error: any) {
      window.alert(
        error.response?.data?.message ||
          "Impossible de créer le paiement."
      );
    } finally {
      setLoadingId(null);
    }
  }

  const bookingHasPayment = (bookingId: string) =>
    payments.some((payment) => payment.bookingId._id === bookingId);
  const payableBookings = bookings.filter(
  (booking) =>
    booking.status === "HELD" &&
    !bookingHasPayment(booking.id)
);
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Mes paiements</h1>

        {message && <p className="mt-8">{message}</p>}

        <section className="mt-8 space-y-4">
          {payments.map((payment) => (
            <article
              key={payment._id}
              className="rounded-2xl border border-foreground/15 p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-foreground/60">Événement</p>
                  <p className="font-semibold">
                    {payment.bookingId.eventTypeKey}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-foreground/60">Date</p>
                  <p className="font-semibold">
                    {payment.bookingId.eventDate}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-foreground/60">Méthode</p>
                  <p className="font-semibold">{payment.method}</p>
                </div>

                {payment.reference && (
  <div>
    <p className="text-sm text-foreground/60">
      Référence
    </p>
    <p className="font-semibold">{payment.reference}</p>
  </div>
)}

                <div>
                  <p className="text-sm text-foreground/60">Acompte</p>
                  <p className="font-semibold">
                    {formatDZD(payment.amountDZD)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-foreground/60">Statut</p>
                  <p className="font-semibold text-gold">
                    {payment.status}
                  </p>
                </div>
              </div>

              {payment.status === "PENDING" && (
                <Link
                  to={`/espace/preuves?bookingId=${payment.bookingId._id}`}
                  className="mt-6 inline-block rounded-xl bg-gold px-5 py-3 font-semibold text-black"
                >
                  Envoyer la preuve
                </Link>
              )}

              {payment.status === "REJECTED" && (
                <p className="mt-5 rounded-xl bg-red-100 p-4 text-red-800">
                  Preuve refusée : {payment.rejectionReason}
                </p>
              )}
            </article>
          ))}
        </section>

        <section className="mt-12 border-t border-foreground/15 pt-10">
          <h2 className="text-2xl font-bold">Créer un paiement</h2>

          <div className="mt-6 space-y-4">
            {payableBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-foreground/15 p-6"
                >
                  <p className="font-semibold">
                    {booking.eventTypeKey} - {booking.eventDate}
                  </p>

                  <p className="mt-2 text-sm text-foreground/70">
                    Acompte : {formatDZD(booking.depositDZD)}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <select
                      value={methods[booking.id] || "CCP"}
                      onChange={(event) =>
                        setMethods((current) => ({
                          ...current,
                          [booking.id]: event.target.value as PaymentMethod,
                        }))
                      }
                      className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                    >
                      <option value="CCP">CCP</option>
                      <option value="BARIDIMOB">BaridiMob</option>
                      <option value="VIREMENT">Virement</option>
                    </select>
                      
                      {booking.pricingMarket === "DIASPORA" && (
                   <select
                     value={payerIds[booking.id] || ""}                 
    onChange={(event) =>
      setPayerIds((current) => ({
        ...current,
        [booking.id]: event.target.value,
      }))
    }
    className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
                   >
                     <option value="">Je paie moi-même</option>
                 
                     {payers
                       .filter(                 
        (payer) =>
          payer.bookingId._id === booking.id &&
          payer.paymentMethod === (methods[booking.id] || "CCP")
                       )
                       .map((payer) => (
                         <option key={payer._id} value={payer._id}>
                           {payer.name} — {payer.relationship}
                         </option>
                       ))}
                   </select>
                 )}

                                 <input
                type="text"
                value={references[booking.id] || ""}
                onChange={(event) =>
                  setReferences((current) => ({
                    ...current,
                    [booking.id]: event.target.value,
                  }))
                }
                placeholder="Référence du paiement"
                className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
              />

                    <button
                      type="button"
                      onClick={() => handleCreatePayment(booking.id)}
                      disabled={loadingId === booking.id}
                      className="rounded-xl bg-black px-5 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
                    >
                      {loadingId === booking.id
                        ? "Création..."
                        : "Choisir ce paiement"}
                    </button>
                  </div>
                </article>
              ))}
              {payableBookings.length === 0 ? (
  <div className="rounded-2xl border border-foreground/15 bg-foreground/5 p-6 text-foreground/70">
    Aucune réservation n’attend actuellement un acompte.
    <Link
      to="/espace/nouvelle-reservation"
      className="mt-4 inline-block font-semibold text-gold underline"
    >
      Créer une réservation
    </Link>
  </div>
) : null}
          </div>
        </section>
      </div>
    </main>
  );
}