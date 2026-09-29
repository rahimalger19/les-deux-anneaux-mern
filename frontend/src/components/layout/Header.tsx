import { useState } from "react";
import { Link } from "react-router-dom";
import { useCurrency } from "../../hooks/useCurrency";
import { useLanguage } from "../../hooks/useLanguage";
import { useTheme } from "../../hooks/useTheme";

const navigation = [
  { to: "/", key: "nav.home" },
  { to: "/la-salle", key: "nav.hall" },
  { to: "/services", key: "nav.services" },
  { to: "/packs-tarifs", key: "nav.pricing" },
  { to: "/galerie", key: "nav.gallery" },
  { to: "/avis", key: "nav.reviews" },
  { to: "/contact", key: "nav.contact" },
] as const;

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();

  const logo =
    resolvedTheme === "dark"
      ? "/images/logo-dark-mode.jpg"
      : "/images/logo-white-mode.jpg";

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-ivory/95 backdrop-blur-md dark:border-white/10 dark:bg-black/95">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="h-14 w-40 shrink-0">
          <img
            src={logo}
            alt="Les Deux Anneaux"
            className="h-full w-full object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-black transition hover:text-gold dark:text-ivory"
            >
              {t(item.key)}
            </Link>
          ))}

          <select
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as "fr-DZ" | "ar-DZ" | "en")
            }
            className="rounded-lg border border-black/10 bg-transparent px-2 py-2 text-sm dark:border-white/10 dark:text-ivory"
          >
            <option value="fr-DZ">FR</option>
            <option value="ar-DZ">AR</option>
            <option value="en">EN</option>
          </select>

          <select
            value={currency}
            onChange={(event) =>
              setCurrency(event.target.value as "DZD" | "EUR" | "USD")
            }
            className="rounded-lg border border-black/10 bg-transparent px-2 py-2 text-sm dark:border-white/10 dark:text-ivory"
          >
            <option value="DZD">DZD</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>

          <select
            value={theme}
            onChange={(event) =>
              setTheme(event.target.value as "light" | "dark" | "system")
            }
            className="rounded-lg border border-black/10 bg-transparent px-2 py-2 text-sm dark:border-white/10 dark:text-ivory"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>

          <Link
            to="/reservation"
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-ivory dark:bg-gold dark:text-black"
          >
            {t("nav.book")}
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg p-2 text-2xl text-black dark:text-ivory lg:hidden"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-2 border-t border-black/10 bg-ivory px-5 py-6 dark:border-white/10 dark:bg-black lg:hidden">
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-black dark:text-ivory"
            >
              {t(item.key)}
            </Link>
          ))}

          <div className="mt-3 grid grid-cols-3 gap-2">
            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as "fr-DZ" | "ar-DZ" | "en")
              }
              className="rounded-lg border border-black/10 bg-transparent px-2 py-2 dark:border-white/10 dark:text-ivory"
            >
              <option value="fr-DZ">FR</option>
              <option value="ar-DZ">AR</option>
              <option value="en">EN</option>
            </select>

            <select
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value as "DZD" | "EUR" | "USD")
              }
              className="rounded-lg border border-black/10 bg-transparent px-2 py-2 dark:border-white/10 dark:text-ivory"
            >
              <option value="DZD">DZD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>

            <select
              value={theme}
              onChange={(event) =>
                setTheme(event.target.value as "light" | "dark" | "system")
              }
              className="rounded-lg border border-black/10 bg-transparent px-2 py-2 dark:border-white/10 dark:text-ivory"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <Link
            to="/reservation"
            onClick={() => setMenuOpen(false)}
            className="mt-3 rounded-full bg-gold px-5 py-3 text-center font-semibold text-black"
          >
            {t("nav.book")}
          </Link>
        </nav>
      )}
    </header>
  );
}