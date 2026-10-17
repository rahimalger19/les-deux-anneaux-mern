import { useEffect, useState } from "react";
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
  { to: "/partenaires", key:"nav.partners"},
  { to: "/faq", key:"nav.faq"}
] as const;

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { user } = useAuth();
  
  const [profileImageError, setProfileImageError] = useState(false);

useEffect(() => {
  setProfileImageError(false);
}, [user?.profilePhotoUrl]);

const backendUrl = (import.meta.env.VITE_API_URL || "")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const profilePhotoUrl = user?.profilePhotoUrl
  ? user.profilePhotoUrl.startsWith("http")
    ? user.profilePhotoUrl
    : `${backendUrl}${user.profilePhotoUrl}`
  : "";
  const isClient = user?.role === "CLIENT";
  const profileInitials = (user?.name || "")
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();
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
  <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/95 text-foreground backdrop-blur-md">
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link to="/" className="h-14 w-40 shrink-0">
        <img
          src={logo}
          alt={t("brand.name")}
          className="h-full w-full object-contain"
        />
      </Link>

      {/* Desktop navigation */}
      <nav className="hidden items-center gap-2 whitespace-nowrap lg:flex xl:gap-3">
        {navigation.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="whitespace-nowrap text-xs font-medium text-foreground transition hover:text-gold xl:text-sm"
          >
            {t(item.key)}
          </Link>
        ))}

        <select
          value={language}
          onChange={(event) =>
            setLanguage(event.target.value as "fr-DZ" | "ar-DZ" | "en")
          }
          className="rounded-lg border border-foreground/10 bg-background px-2 py-2 text-sm text-foreground"
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
          className="rounded-lg border border-foreground/10 bg-background px-2 py-2 text-sm text-foreground"
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
          className="rounded-lg border border-foreground/10 bg-background px-2 py-2 text-sm text-foreground"
        >
          <option value="light">{t("common.light")}</option>
          <option value="dark">{t("common.dark")}</option>
          <option value="system">{t("common.system")}</option>
        </select>

        {/* Authentication links */}
{user ? (
  isClient ? (
    <Link
      to="/espace/profil"
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/60 bg-espresso text-sm font-bold text-ivory shadow-sm transition hover:scale-105 hover:border-gold hover:ring-2 hover:ring-gold/30"
      aria-label={`Ouvrir le profil de ${user.name}`}
      title={user.name}
    >
      {profilePhotoUrl && !profileImageError ? (
        <img
          src={profilePhotoUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setProfileImageError(true)}
        />
      ) : (
        <span>{profileInitials || "?"}</span>
      )}
    </Link>
  ) : (
    <Link
      to={dashboardTo}
      className="rounded-full border border-foreground/20 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold"
    >
      {dashboardLabel}
    </Link>
  )
) : (
  <>
    <Link
      to="/connexion"
      className="text-sm font-semibold text-foreground transition hover:text-gold"
    >
      {t("common.login")}
    </Link>

    <Link
      to="/inscription"
      className="rounded-full border border-foreground/20 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold"
    >
      {t("common.register")}
    </Link>
  </>
)}

        {/* Reservation button */}
        <Link
          to="/reservation"
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-gold/90"
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
        className="rounded-lg p-2 text-2xl text-foreground transition hover:text-gold lg:hidden"
      >
        {menuOpen ? "×" : "☰"}
      </button>
    </div>

    {/* Mobile navigation */}
    {menuOpen && (
      <nav className="flex flex-col gap-2 border-t border-foreground/10 bg-background px-5 py-6 text-foreground lg:hidden">
        {navigation.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-4 py-3 text-foreground transition hover:bg-foreground/5 hover:text-gold"
          >
            {t(item.key)}
          </Link>
        ))}

        {/* Authentication links */}
{user ? (
  isClient ? (
    <Link
      to="/espace/profil"
      onClick={() => setMenuOpen(false)}
      className="flex items-center gap-3 rounded-lg px-4 py-3 font-semibold text-foreground transition hover:bg-foreground/5 hover:text-gold"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/60 bg-espresso text-sm font-bold text-ivory">
        {profilePhotoUrl && !profileImageError ? (
          <img
            src={profilePhotoUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setProfileImageError(true)}
          />
        ) : (
          profileInitials || "?"
        )}
      </span>

      <span>Mon profil</span>
    </Link>
  ) : (
    <Link
      to={dashboardTo}
      onClick={() => setMenuOpen(false)}
      className="rounded-lg px-4 py-3 font-semibold text-foreground transition hover:bg-foreground/5 hover:text-gold"
    >
      {dashboardLabel}
    </Link>
  )
) : (
  <>
    <Link
      to="/connexion"
      onClick={() => setMenuOpen(false)}
      className="rounded-lg px-4 py-3 font-semibold text-foreground transition hover:text-gold"
    >
      {t("common.login")}
    </Link>

    <Link
      to="/inscription"
      onClick={() => setMenuOpen(false)}
      className="rounded-lg px-4 py-3 font-semibold text-foreground transition hover:text-gold"
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
            className="min-w-0 rounded-lg border border-foreground/10 bg-background px-2 py-2 text-foreground"
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
            className="min-w-0 rounded-lg border border-foreground/10 bg-background px-2 py-2 text-foreground"
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
            className="min-w-0 rounded-lg border border-foreground/10 bg-background px-2 py-2 text-foreground"
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
          className="mt-3 rounded-full bg-gold px-5 py-3 text-center font-semibold text-black transition hover:bg-gold/90"
        >
          {t("nav.book")}
        </Link>
      </nav>
    )}
  </header>
);
}
