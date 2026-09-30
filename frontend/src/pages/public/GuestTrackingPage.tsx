import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getGuestTracking,
  type GuestTrackingResponse,
} from "../../services/booking.service";

import {
  createPayment,
  getPaymentInstructions,
  uploadPaymentProof,
} from "../../services/payment.service";

import type {
  Payment,
  PaymentInstructions,
  PaymentMethod,
} from "../../types/payment.types";

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    PRICED: "Tarif calculé",
    OTP_PENDING: "En attente de confirmation OTP",
    HELD: "Créneau bloqué temporairement",
    PROOF_PENDING: "Preuve de paiement en attente",
    PAID: "Paiement validé",
    INVOICED: "Facture émise",
    DONE: "Réservation terminée",
    CANCELLED: "Réservation annulée",
    EXPIRED: "Créneau expiré",
  };

  return labels[status] || status;
}

export default function GuestTrackingPage() {
  const { token } = useParams();

  const [booking, setBooking] =
    useState<GuestTrackingResponse["booking"] | null>(null);

  const [message, setMessage] = useState("Chargement...");
  const [error, setError] = useState(false);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentInstructions, setPaymentInstructions] =
    useState<PaymentInstructions | null>(null);

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod | null>(null);

  const [paymentMessage, setPaymentMessage] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofMessage, setProofMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // 1. Charger la réservation
  useEffect(() => {
    if (!token) {
      setError(true);
      setMessage("Lien de suivi invalide.");
      return;
    }

    getGuestTracking(token)
      .then((result) => {
        setBooking(result.booking);
        setMessage("");
        setError(false);
      })
      .catch((requestError: any) => {
        setError(true);
        setMessage(
          requestError.response?.data?.message ||
            "Impossible de charger votre réservation."
        );
      });
  }, [token]);

  // 2. Charger les informations de paiement
  useEffect(() => {
    getPaymentInstructions()
      .then((instructions) => {
        setPaymentInstructions(instructions);
      })
      .catch(() => {
        setPaymentMessage(
          "Impossible de charger les instructions de paiement."
        );
      });
  }, []);

  // 3. Charger le paiement existant
  useEffect(() => {
    if (!booking) return;

    import("../../services/payment.service")
      .then(({ getBookingPayment }) => getBookingPayment(booking.id))
      .then((result) => {
        setPayment(result);
      })
      .catch(() => {
        // Aucun paiement n'existe encore.
      });
  }, [booking]);

  async function handleCreatePayment(method: PaymentMethod) {
    if (!booking) return;

    try {
      setPaymentMessage("");

const createdPayment = await createPayment(booking.id, method);

setPayment(createdPayment);
setSelectedMethod(method);
      setPaymentMessage(
        "Méthode de paiement sélectionnée. Vous pouvez maintenant envoyer votre preuve."
      );

      setBooking((current) =>
        current
          ? {
              ...current,
              status: "PROOF_PENDING",
            }
          : current
      );
    } catch (requestError: any) {
      setPaymentMessage(
        requestError.response?.data?.message ||
          "Impossible de sélectionner cette méthode de paiement."
      );
    }
  }

  async function handleUploadProof() {
    if (!booking) return;

    if (!proofFile) {
      setProofMessage("Veuillez sélectionner votre preuve de paiement.");
      return;
    }

    try {
      setIsUploading(true);
      setProofMessage("");

      await uploadPaymentProof(booking.id, proofFile);

      setProofMessage("Votre preuve de paiement a été envoyée avec succès.");

      setBooking((current) =>
        current
          ? {
              ...current,
              status: "PROOF_PENDING",
            }
          : current
      );

      const updatedPayment = await import(
        "../../services/payment.service"
      ).then(({ getBookingPayment }) => getBookingPayment(booking.id));

      setPayment(updatedPayment);
    } catch (requestError: any) {
      setProofMessage(
        requestError.response?.data?.message ||
          "Impossible d'envoyer la preuve de paiement."
      );
    } finally {
      setIsUploading(false);
    }
  }

  if (message || !booking) {
    return (
      <section className="min-h-[60vh] bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-3xl">
          <p className={error ? "text-red-600" : "text-foreground"}>
            {message || "Chargement de votre réservation..."}
          </p>
        </div>
      </section>
    );
  }

  const selectedInstructions =
    selectedMethod && paymentInstructions
      ? paymentInstructions[selectedMethod]
      : null;

  return (
    <section className="min-h-[60vh] bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Suivi de réservation
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Votre dossier événement
        </h1>

        {/* Booking information */}
        <div className="mt-8 rounded-2xl border border-gold p-6">
          <p className="text-sm text-foreground/60">Statut</p>

          <p className="mt-1 text-2xl font-bold text-gold">
            {formatStatus(booking.status)}
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-foreground/60">Date</p>
              <p className="font-semibold">{booking.eventDate}</p>
            </div>

            <div>
              <p className="text-sm text-foreground/60">Créneau</p>
              <p className="font-semibold">{booking.slot}</p>
            </div>

            <div>
              <p className="text-sm text-foreground/60">
                Type d'événement
              </p>
              <p className="font-semibold">{booking.eventTypeKey}</p>
            </div>

            <div>
              <p className="text-sm text-foreground/60">Pack</p>
              <p className="font-semibold">{booking.packKey}</p>
            </div>

            <div>
              <p className="text-sm text-foreground/60">Invités</p>
              <p className="font-semibold">
                Femmes: {booking.womenGuests} · Hommes:{" "}
                {booking.menGuests}
              </p>
            </div>

            <div>
              <p className="text-sm text-foreground/60">
                Total estimé
              </p>
              <p className="font-semibold">
                {formatDZD(booking.totalDZD)}
              </p>
            </div>

            <div>
              <p className="text-sm text-foreground/60">Acompte</p>
              <p className="font-semibold text-gold">
                {formatDZD(booking.depositDZD)}
              </p>
            </div>
          </div>

          {booking.status === "HELD" && booking.holdExpiresAt && (
            <p className="mt-8 rounded-xl bg-yellow-100 p-4 text-yellow-900">
              Votre créneau est temporairement bloqué jusqu'au{" "}
              {new Date(booking.holdExpiresAt).toLocaleString("fr-DZ")}.
            </p>
          )}
        </div>

        {/* Documents */}
<div className="mt-8 rounded-2xl border border-foreground/15 p-6">
  <h2 className="text-2xl font-bold">Documents</h2>

  <p className="mt-2 text-sm text-foreground/70">
    Vos documents sont générés à partir des montants validés par le serveur.
  </p>

  <div className="mt-5 flex flex-wrap gap-3">
    {[
      "HELD",
      "PROOF_PENDING",
      "PAID",
      "INVOICED",
      "DONE",
    ].includes(booking.status) && token && (
      <a
        href={`${import.meta.env.VITE_API_URL}/documents/tracking/${token}/proforma`}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl bg-gold px-5 py-3 font-semibold text-black"
      >
        Ouvrir le pro forma PDF
      </a>
    )}

    {["INVOICED", "DONE"].includes(booking.status) && token && (
      <a
        href={`${import.meta.env.VITE_API_URL}/documents/tracking/${token}/invoice`}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl bg-black px-5 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
      >
        Ouvrir la facture PDF
      </a>
    )}
  </div>
</div>

        {/* Payment */}
        {booking.status === "HELD" && (
          <div className="mt-8 rounded-2xl border border-foreground/15 p-6">
            <h2 className="text-2xl font-bold">
              Choisir le mode de paiement
            </h2>

            <p className="mt-2 text-foreground/70">
              Acompte à payer :{" "}
              <strong>{formatDZD(booking.depositDZD)}</strong>
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleCreatePayment("CCP")}
                className="rounded-xl border border-gold px-4 py-3 font-semibold hover:bg-gold hover:text-black"
              >
                CCP
              </button>

              <button
                type="button"
                onClick={() => handleCreatePayment("BARIDIMOB")}
                className="rounded-xl border border-gold px-4 py-3 font-semibold hover:bg-gold hover:text-black"
              >
                BaridiMob
              </button>

              <button
                type="button"
                onClick={() => handleCreatePayment("VIREMENT")}
                className="rounded-xl border border-gold px-4 py-3 font-semibold hover:bg-gold hover:text-black"
              >
                Virement
              </button>
            </div>

            {paymentMessage && (
              <p className="mt-4 text-sm text-foreground/70">
                {paymentMessage}
              </p>
            )}
          </div>
        )}

        {/* Payment instructions */}
        {selectedInstructions && selectedMethod && (
          <div className="mt-6 rounded-2xl border border-gold p-6">
            <h2 className="text-2xl font-bold">
              Instructions de paiement
            </h2>

            <p className="mt-4 font-semibold">
              {selectedInstructions.label}
            </p>

            {"accountName" in selectedInstructions && (
              <p className="mt-2">
                Nom du compte : {selectedInstructions.accountName}
              </p>
            )}

            {"rip" in selectedInstructions && (
              <p className="mt-2">
                RIP : {selectedInstructions.rip}
              </p>
            )}

            {"accountNumber" in selectedInstructions && (
              <p className="mt-2">
                Numéro : {selectedInstructions.accountNumber}
              </p>
            )}

            {"bankName" in selectedInstructions && (
              <p className="mt-2">
                Banque : {selectedInstructions.bankName}
              </p>
            )}

            {"rib" in selectedInstructions && (
              <p className="mt-2">
                RIB : {selectedInstructions.rib}
              </p>
            )}

            {"reason" in selectedInstructions && (
              <p className="mt-2">
                Motif : {selectedInstructions.reason}
              </p>
            )}
          </div>
        )}

        {/* Proof upload */}
        {(booking.status === "PROOF_PENDING" ||
          payment?.status === "PENDING") && (
          <div className="mt-6 rounded-2xl border border-foreground/15 p-6">
            <h2 className="text-2xl font-bold">
              Envoyer la preuve de paiement
            </h2>

            <p className="mt-2 text-sm text-foreground/70">
              Formats acceptés : JPG, PNG ou PDF. Taille maximale : 5 MB.
            </p>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(event) =>
                setProofFile(event.target.files?.[0] || null)
              }
              className="mt-5 block w-full rounded-xl border border-foreground/20 p-3"
            />

            <button
              type="button"
              onClick={handleUploadProof}
              disabled={isUploading}
              className="mt-4 rounded-xl bg-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
            >
              {isUploading
                ? "Envoi..."
                : "Envoyer la preuve"}
            </button>

            {proofMessage && (
              <p className="mt-4 text-sm">
                {proofMessage}
              </p>
            )}
          </div>
        )}

        {/* Existing payment */}
        {payment && (
          <div className="mt-6 rounded-2xl border border-foreground/15 p-6">
            <h2 className="text-xl font-bold">
              Paiement
            </h2>

            <div className="mt-4 space-y-2 text-sm">
              <p>
                Méthode : <strong>{payment.method}</strong>
              </p>

              <p>
                Montant :{" "}
                <strong>{formatDZD(payment.amountDZD)}</strong>
              </p>

              <p>
                Statut : <strong>{payment.status}</strong>
              </p>

              {payment.proofUrl && (
                <p>
                  Preuve envoyée :{" "}
                  <strong>Oui</strong>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}