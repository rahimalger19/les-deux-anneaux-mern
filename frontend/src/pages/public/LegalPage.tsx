import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import {
  getLegalDocument,
  type LegalDocument,
} from "../../services/legal.service";

export default function LegalPage() {
  const { page } = useParams();
  const { language } = useLanguage();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [message, setMessage] = useState("Chargement...");

  const locale =
    language === "fr-DZ" ? "fr" : language === "ar-DZ" ? "ar" : "en";

  useEffect(() => {
    if (!page) {
      return;
    }

    getLegalDocument(page)
      .then((data) => {
        setDocument(data);
        setMessage("");
      })
      .catch(() =>
        setMessage(
          "Ce document sera publié après validation des informations légales officielles."
        )
      );
  }, [page]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      {document ? (
        <>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
            Informations légales
          </p>

          <h1 className="mt-3 font-serif text-4xl">
            {document.title[locale]}
          </h1>

          <article className="mt-8 whitespace-pre-wrap leading-7 text-black/70">
            {document.content[locale]}
          </article>
        </>
      ) : (
        <>
          <h1 className="font-serif text-4xl">Document indisponible</h1>
          <p className="mt-6 text-black/70">{message}</p>
        </>
      )}
    </main>
  );
}