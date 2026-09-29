import { useContext, useEffect, useState } from "react";
import {
  CurrencyContext,
  type Currency,
} from "../../contexts/CurrencyContext";
import { LanguageContext } from "../../contexts/LanguageContext";
import { ThemeContext, type Theme } from "../../contexts/ThemeContext";
import {
  getMyPreferences,
  updateMyPreferences,
} from "../../services/preferences.service";

export default function PreferencesPage() {
  const languageContext = useContext(LanguageContext);
  const themeContext = useContext(ThemeContext);
  const currencyContext = useContext(CurrencyContext);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [message, setMessage] = useState("");

  if (!languageContext || !themeContext || !currencyContext) {
    return null;
  }

  const { language, setLanguage } = languageContext;
  const { theme, setTheme } = themeContext;
  const { currency, setCurrency } = currencyContext;

  useEffect(() => {
    getMyPreferences()
      .then((preferences) => {
        setLanguage(preferences.language);
        setCurrency(preferences.currency);
        setEmailNotifications(preferences.emailNotifications);
        setSmsNotifications(preferences.smsNotifications);
      })
      .catch(() =>
        setMessage("Impossible de charger les préférences.")
      );
  }, [setCurrency, setLanguage]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      await updateMyPreferences({
        language,
        currency,
        emailNotifications,
        smsNotifications,
      });

      setMessage("Préférences enregistrées.");
    } catch {
      setMessage("Impossible d'enregistrer les préférences.");
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Préférences</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-2xl border border-foreground/15 p-6"
        >
          <label className="block">
            <span className="text-sm font-semibold">Langue</span>

            <select
              value={language}
              onChange={(event) =>
                setLanguage(
                  event.target.value as "fr-DZ" | "ar-DZ" | "en"
                )
              }
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="fr-DZ">Français</option>
              <option value="ar-DZ">العربية</option>
              <option value="en">English</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Thème</span>

            <select
              value={theme}
              onChange={(event) =>
                setTheme(event.target.value as Theme)
              }
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
              <option value="system">Système</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Devise affichée</span>

            <select
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value as Currency)
              }
              className="mt-2 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="DZD">DZD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(event) =>
                setEmailNotifications(event.target.checked)
              }
            />
            Recevoir les notifications par email
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={smsNotifications}
              onChange={(event) =>
                setSmsNotifications(event.target.checked)
              }
            />
            Recevoir les notifications par SMS
          </label>

          <button
            type="submit"
            className="rounded-xl bg-gold px-6 py-3 font-semibold text-black"
          >
            Enregistrer
          </button>
        </form>

        {message && <p className="mt-6">{message}</p>}
      </div>
    </main>
  );
}