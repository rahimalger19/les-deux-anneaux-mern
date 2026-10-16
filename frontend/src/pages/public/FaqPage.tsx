import { useEffect, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import {
  getPublicFaqs,
  type Faq,
} from "../../services/public-content.service";

export default function FaqPage() {
  const { language } = useLanguage();
  const [faqs, setFaqs] = useState<Faq[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

  const locale =
    language === "fr-DZ" ? "fr" : language === "ar-DZ" ? "ar" : "en";

  useEffect(() => {
  async function loadFaqs() {
    try {
      setLoading(true);
      setError("");

      const data = await getPublicFaqs();
      setFaqs(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load frequently asked questions."
      );
    } finally {
      setLoading(false);
    }
  }

  void loadFaqs();
}, []);

  
return (
  <main
    dir={locale === "ar" ? "rtl" : "ltr"}
    lang={locale}
    className="min-h-screen bg-background text-foreground"
  >
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        FAQ
      </p>

      <h1 className="mt-3 font-serif text-4xl text-foreground">
        {locale === "fr"
          ? "Questions fréquentes"
          : locale === "ar"
            ? "الأسئلة الشائعة"
            : "Frequently Asked Questions"}
      </h1>

      <div className="mt-5 h-px w-16 bg-gold" />

      {loading ? (
        <p className="mt-8 rounded-xl border border-foreground/10 bg-surface p-6 text-foreground/70">
          {locale === "fr"
            ? "Chargement des questions..."
            : locale === "ar"
              ? "جارٍ تحميل الأسئلة..."
              : "Loading questions..."}
        </p>
      ) : error ? (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-600 dark:text-red-300"
        >
          {error}
        </p>
      ) : faqs.length === 0 ? (
        <p className="mt-8 rounded-xl border border-foreground/10 bg-surface p-6 text-foreground/70">
          {locale === "fr"
            ? "Les réponses officielles seront publiées après validation."
            : locale === "ar"
              ? "سيتم نشر الإجابات الرسمية بعد اعتمادها."
              : "Official answers will be published after approval."}
        </p>
      ) : (
        <div className="mt-10 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq._id}
              className="group rounded-2xl border border-foreground/10 bg-surface p-5 transition-colors open:border-gold/50"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground marker:content-none">
                <span>{faq.question[locale]}</span>

                <span className="shrink-0 text-xl text-gold transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="mt-4 border-t border-foreground/10 pt-4">
                <p className="leading-7 text-foreground/75">
                  {faq.answer[locale]}
                </p>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  </main>
);

}