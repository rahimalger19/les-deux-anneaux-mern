import { useEffect, useState } from "react";
import {
  getMyDocuments,
  type ClientDocument,
} from "../../services/document.service";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<ClientDocument[]>([]);
  const [message, setMessage] = useState("Chargement des factures...");

  useEffect(() => {
    getMyDocuments()
      .then((documents) => {
        const issuedInvoices = documents.filter(
          (document) => document.invoiceNumber
        );

        setInvoices(issuedInvoices);

        setMessage(
          issuedInvoices.length === 0
            ? "Aucune facture disponible pour le moment."
            : ""
        );
      })
      .catch(() => {
        setMessage("Impossible de charger vos factures.");
      });
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Mes factures</h1>

        {message && <p className="mt-8">{message}</p>}

        <div className="mt-8 space-y-4">
          {invoices.map((invoice) => (
            <article
              key={invoice.bookingId}
              className="rounded-2xl border border-foreground/15 p-6"
            >
              <p className="text-sm text-foreground/60">
                {invoice.eventDate} - {invoice.eventTypeKey}
              </p>

              <p className="mt-2 text-lg font-semibold text-gold">
                {invoice.invoiceNumber}
              </p>

              <a
                href={`${import.meta.env.VITE_API_URL}/documents/my/${invoice.bookingId}/invoice`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block rounded-xl bg-black px-5 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
              >
                Ouvrir la facture PDF
              </a>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}