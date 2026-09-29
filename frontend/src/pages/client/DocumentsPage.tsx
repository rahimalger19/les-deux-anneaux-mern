import { useEffect, useState } from "react";
import {
  getMyDocuments,
  type ClientDocument,
} from "../../services/document.service";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [message, setMessage] = useState("Chargement des documents...");

  useEffect(() => {
    getMyDocuments()
      .then((data) => {
        setDocuments(data);
        setMessage(
          data.length === 0
            ? "Aucun document disponible pour le moment."
            : ""
        );
      })
      .catch(() => {
        setMessage("Impossible de charger vos documents.");
      });
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Mes documents</h1>

        {message && <p className="mt-8">{message}</p>}

        <div className="mt-8 space-y-4">
          {documents.map((document) => (
            <article
              key={document.bookingId}
              className="rounded-2xl border border-foreground/15 p-6"
            >
              <p className="text-sm text-foreground/60">
                {document.eventDate} - {document.eventTypeKey}
              </p>

              <p className="mt-2 font-semibold">
                Statut : {document.status}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={`${import.meta.env.VITE_API_URL}/documents/my/${document.bookingId}/proforma`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-gold px-5 py-3 font-semibold text-black"
                >
                  Pro forma {document.proFormaNumber}
                </a>

                {document.invoiceNumber && (
                  <a
                    href={`${import.meta.env.VITE_API_URL}/documents/my/${document.bookingId}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-black px-5 py-3 font-semibold text-ivory dark:bg-gold dark:text-black"
                  >
                    Facture {document.invoiceNumber}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}