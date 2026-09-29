import { useEffect, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import {
  getPublicFaqs,
  type Faq,
} from "../../services/public-content.service";

export default function FaqPage() {
  const { language } = useLanguage();
  const [faqs, setFaqs] = useState<Faq[]>([]);

  const locale =
    language === "fr-DZ" ? "fr" : language === "ar-DZ" ? "ar" : "en";

  useEffect(() => {
    getPublicFaqs().then(setFaqs);
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-serif text-4xl">Questions fréquentes</h1>

      {faqs.length === 0 ? (
        <p className="mt-8 text-black/70">
          Les réponses officielles seront publiées après validation.
        </p>
      ) : (
        <div className="mt-10 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq._id}
              className="rounded-xl border border-black/10 bg-white p-5"
            >
              <summary className="cursor-pointer font-semibold">
                {faq.question[locale]}
              </summary>

              <p className="mt-4 leading-7 text-black/70">
                {faq.answer[locale]}
              </p>
            </details>
          ))}
        </div>
      )}
    </main>
  );
}