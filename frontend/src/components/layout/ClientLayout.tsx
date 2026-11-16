import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";

const links = [
  { to: "/espace", key: "client.home", icon: "⌂" },
  { to: "/espace/nouvelle-reservation", key: "client.book", icon: "+" },
  { to: "/espace/reservations", key: "client.bookings", icon: "▣" },
  { to: "/espace/rendez-vous", key: "client.appointments", icon: "◷" },
  { to: "/espace/paiements", key: "client.payments", icon: "◈" },
  { to: "/espace/preuves", key: "client.proofs", icon: "↑" },
  { to: "/espace/documents", key: "client.documents", icon: "▤" },
  { to: "/espace/factures", key: "client.invoices", icon: "◫" },
  { to: "/espace/devis", key: "client.quotes", icon: "◧" },
  { to: "/espace/messages", key: "client.messages", icon: "✉" },
  { to: "/espace/notifications", key: "client.notifications", icon: "●" },
  { to: "/espace/galerie-favoris", key: "client.favorites", icon: "♥" },
  { to: "/espace/avis", key: "client.reviews", icon: "★" },
  { to: "/espace/invites", key: "client.guests", icon: "☷" },
  { to: "/espace/profil", key: "client.profile", icon: "◉" },
  { to: "/espace/preferences", key: "client.preferences", icon: "⚙" },
  { to: "/espace/securite", key: "client.security", icon: "◉" },
  { to: "/espace/aide", key: "client.help", icon: "?" },
  { to: "/espace/payeur", key: "client.payer", icon: "◉" },
] as const;

const mobileLinks = links.filter((link) =>
  [
    "/espace",
    "/espace/nouvelle-reservation",
    "/espace/reservations",
    "/espace/notifications",
    "/espace/profil",
  ].includes(link.to)
);

const moreMobileLinks = links.filter(
  (link) => !mobileLinks.some((mobileLink) => mobileLink.to === link.to)
);

export default function ClientLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
  navigate("/", { replace: true });
  void logout();
}

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-foreground/15 bg-ivory p-6 dark:bg-black md:flex md:flex-col">
     <p className="text-xl font-bold text-gold">{t("brand.name")}</p>

        <p className="mt-2 text-sm text-foreground/60">
         {t("client.greeting")}, {user?.name}
                 </p>

        <nav className="mt-10 min-h-0 flex-1 overflow-y-auto pr-2">
  <div className="flex flex-col gap-2">
    {links.map((link) => (
      <NavLink
        key={link.to}
        to={link.to}
        end={link.to === "/espace"}
        className={({ isActive }) =>
          `rounded-xl px-4 py-3 transition ${
            isActive
              ? "bg-gold font-semibold text-black"
              : "hover:bg-foreground/10"
          }`
        }
      >
        <span className="mr-3">{link.icon}</span>
       {t(link.key)}
             </NavLink>
    ))}
  </div>
</nav>
         <div className="mt-5 border-t border-foreground/15 pt-5">
          <NavLink
            to="/"
            className="block rounded-xl px-4 py-3 hover:bg-foreground/10"
          >
            Voir le site
          </NavLink>
        <button
  type="button"
  onClick={handleLogout}
  className="shrink-0 rounded-xl border border-red-700 px-4 py-3 text-left font-semibold text-red-700"
>
  {t("common.logout")}
</button>
</div>
      </aside>

      <section className="min-h-screen pb-24 md:ml-64 md:pb-0">
        <Outlet />
      </section>
    {mobileMenuOpen ? (
  <div className="fixed inset-x-0 bottom-[73px] z-50 max-h-[65vh] overflow-y-auto border-t border-foreground/15 bg-ivory p-4 shadow-2xl dark:bg-black md:hidden">
    <div className="grid grid-cols-2 gap-2">
      {moreMobileLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={() => setMobileMenuOpen(false)}
          className={({ isActive }) =>
            `rounded-xl px-3 py-3 text-sm ${
              isActive
                ? "bg-gold font-semibold text-black"
                : "bg-foreground/5 text-foreground"
            }`
          }
        >
          <span className="mr-2">{link.icon}</span>
          {t(link.key)}
        </NavLink>
      ))}
    </div>
  </div>
) : null}

<nav className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-foreground/15 bg-ivory px-1 py-2 dark:bg-black md:hidden">
  {mobileLinks.map((link) => (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.to === "/espace"}
      className={({ isActive }) =>
        `flex min-w-14 flex-col items-center rounded-lg px-1 py-1 text-xs ${
          isActive ? "text-gold" : "text-foreground/65"
        }`
      }
    >
      <span className="text-lg">{link.icon}</span>
      <span>{t(link.key)}</span>
    </NavLink>
  ))}

  <button
    type="button"
    onClick={() => setMobileMenuOpen((open) => !open)}
    className="flex min-w-14 flex-col items-center rounded-lg px-1 py-1 text-xs text-foreground/65"
  >
    <span className="text-lg">☰</span>
    <span>Menu</span>
  </button>
</nav>
    
    </div>
  );
}