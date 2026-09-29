import { useEffect, useState } from "react";
import {
  getPendingProofPayments,
  rejectPayment,
  validatePayment,
  type AdminPayment,
} from "../../services/admin-payment.service";

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [message, setMessage] = useState("Loading payments...");
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadPayments() {
    try {
      const data = await getPendingProofPayments();
      setPayments(data);
      setMessage(data.length === 0 ? "No payment proof is waiting." : "");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Unable to load payment proofs."
      );
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function handleValidate(paymentId: string) {
    const reference = window.prompt(
      "Enter the CCP, BaridiMob, or bank-transfer reference:"
    );

    if (reference === null) return;

    try {
      setProcessingId(paymentId);
      await validatePayment(paymentId, reference);
      await loadPayments();
    } catch (error: any) {
      window.alert(
        error.response?.data?.message || "Unable to validate payment."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(paymentId: string) {
    const reason = window.prompt("Enter the rejection reason:");

    if (!reason?.trim()) return;

    try {
      setProcessingId(paymentId);
      await rejectPayment(paymentId, reason.trim());
      await loadPayments();
    } catch (error: any) {
      window.alert(
        error.response?.data?.message || "Unable to reject payment."
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Paiements et preuves</h1>

        <p className="mt-3 text-foreground/70">
          Validez ou refusez les preuves CCP, BaridiMob et virements.
        </p>

        {message && <p className="mt-8">{message}</p>}

        <div className="mt-8 space-y-5">
          {payments.map((payment) => {
           const booking = payment.booking;

            return (
              <article
                key={payment.id}
                className="rounded-2xl border border-foreground/15 p-6"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-foreground/60">Payment method</p>
                    <p className="font-semibold">{payment.method}</p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground/60">Deposit amount</p>
                    <p className="font-semibold">
                      {formatDZD(payment.amountDZD)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground/60">Event date</p>
                    <p className="font-semibold">
                      {booking?.eventDate || "Unavailable"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground/60">Slot</p>
                    <p className="font-semibold">
                      {booking?.slot || "Unavailable"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground/60">Event type</p>
                    <p className="font-semibold">
                      {booking?.eventTypeKey || "Unavailable"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground/60">Proof file</p>
                    <p className="font-semibold">
                      {payment.proofFileName || "No file name"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleValidate(payment.id)}
                    disabled={processingId === payment.id}
                    className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    Validate and issue invoice
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReject(payment.id)}
                    disabled={processingId === payment.id}
                    className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    Reject proof
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}