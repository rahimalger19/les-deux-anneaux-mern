import { useState } from "react";
import { Link } from "react-router-dom";
import { useCurrency } from "../../hooks/useCurrency";
import { useLanguage } from "../../hooks/useLanguage";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { getDashboardRoute } from "../../lib/dashboard-route";

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
  const { user } = useAuth();

  const logo =
    resolvedTheme === "dark"
      ? "/images/logo-dark-mode.jpg"
      : "/images/logo-white-mode.jpg";

  const dashboardTo = getDashboardRoute(user?.role);

const dashboardLabel =
  dashboardTo === "/super"
    ? t("account.superAdministration")
    : dashboardTo === "/admin"
      ? t("account.administration")
      : t("account.clientSpace");

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-ivory/95 backdrop-blur-md dark:border-white/10 dark:bg-black/95">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="h-14 w-40 shrink-0">
          <img
            src={logo}
            alt={t("brand.name")}
            className="h-full w-full object-contain"
          />
        </Link>

        {/* Desktop navigation */}
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
            <option value="light">{t("common.light")}</option>
            <option value="dark">{t("common.dark")}</option>
            <option value="system">{t("common.system")}</option>
          </select>

          {/* Authentication links */}
          {user ? (
            <Link
              to={dashboardTo}
              className="rounded-full border border-black/20 px-4 py-2.5 text-sm font-semibold text-black dark:border-white/20 dark:text-ivory"
            >
              {dashboardLabel}
            </Link>
          ) : (
            <>
              <Link
                to="/connexion"
                className="text-sm font-semibold text-black transition hover:text-gold dark:text-ivory"
              >
                {t("common.login")}
              </Link>

              <Link
                to="/inscription"
                className="rounded-full border border-black/20 px-4 py-2.5 text-sm font-semibold text-black dark:border-white/20 dark:text-ivory"
              >
                {t("common.register")}
              </Link>
            </>
          )}

          {/* Reservation button */}
          <Link
            to="/reservation"
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-ivory dark:bg-gold dark:text-black"
          >
            {t("nav.book")}
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={
            menuOpen ? t("common.closeMenu") : t("common.openMenu")
          }
          aria-expanded={menuOpen}
          className="rounded-lg p-2 text-2xl text-black dark:text-ivory lg:hidden"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {/* Mobile navigation */}
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

          {/* Authentication links */}
          {user ? (
            <Link
              to={dashboardTo}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 font-semibold text-black dark:text-ivory"
            >
              {dashboardLabel}
            </Link>
          ) : (
            <>
              <Link
                to="/connexion"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 font-semibold text-black dark:text-ivory"
              >
                {t("common.login")}
              </Link>

              <Link
                to="/inscription"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 font-semibold text-black dark:text-ivory"
              >
                {t("common.register")}
              </Link>
            </>
          )}

          {/* Mobile selectors */}
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
              <option value="light">{t("common.light")}</option>
              <option value="dark">{t("common.dark")}</option>
              <option value="system">{t("common.system")}</option>
            </select>
          </div>

          {/* Mobile reservation button */}
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
