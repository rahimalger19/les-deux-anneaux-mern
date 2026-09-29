import { useEffect, useState } from "react";
import {
  getMyPayments,
  uploadMyPaymentProof,
  type ClientPayment,
} from "../../services/client-payment.service";

export default function ProofsPage() {
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("Chargement...");
  const [uploading, setUploading] = useState(false);

  async function loadPayments() {
    try {
      const data = await getMyPayments();

      const pendingPayments = data.filter(
        (payment) => payment.status === "PENDING"
      );

      setPayments(pendingPayments);

      if (pendingPayments.length > 0) {
        setSelectedBookingId((current) =>
          current || pendingPayments[0].bookingId._id
        );
      }

      setMessage(
        pendingPayments.length === 0
          ? "Aucune preuve de paiement en attente."
          : ""
      );
    } catch {
      setMessage("Impossible de charger vos paiements.");
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function handleUpload() {
    if (!selectedBookingId) {
      setMessage("Choisissez un paiement.");
      return;
    }

    if (!file) {
      setMessage("Sélectionnez une image ou un PDF.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      await uploadMyPaymentProof(selectedBookingId, file);

      setFile(null);
      setMessage(
        "Preuve envoyée. Elle sera vérifiée par l'administration."
      );

      await loadPayments();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d'envoyer la preuve."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Mes preuves de paiement
        </h1>

        <p className="mt-4 text-foreground/70">
          Formats acceptés : JPG, PNG et PDF. Taille maximale : 5 MB.
        </p>

        {payments.length > 0 && (
          <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
            <label className="block text-sm font-semibold">
              Paiement concerné
            </label>

            <select
              value={selectedBookingId}
              onChange={(event) => setSelectedBookingId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              {payments.map((payment) => (
                <option
                  key={payment._id}
                  value={payment.bookingId._id}
                >
                  {payment.bookingId.eventTypeKey} -{" "}
                  {payment.bookingId.eventDate} - {payment.method}
                </option>
              ))}
            </select>

            <label className="mt-6 block text-sm font-semibold">
              Fichier de preuve
            </label>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(event) =>
                setFile(event.target.files?.[0] || null)
              }
              className="mt-2 block w-full rounded-xl border border-foreground/20 p-3"
            />

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="mt-5 rounded-xl bg-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
            >
              {uploading ? "Envoi..." : "Envoyer la preuve"}
            </button>
          </section>
        )}

        {message && <p className="mt-6">{message}</p>}
      </div>
    </main>
  );
}