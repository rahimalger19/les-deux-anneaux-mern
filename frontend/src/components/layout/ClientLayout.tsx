import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { to: "/espace", label: "Accueil", icon: "⌂" },
  { to: "/espace/nouvelle-reservation", label: "Réserver", icon: "+" },
  { to: "/espace/reservations", label: "Réservations", icon: "▣" },
  { to: "/espace/rendez-vous", label: "Rendez-vous", icon: "◷" },
  { to: "/espace/paiements", label: "Paiements", icon: "◈" },
  { to: "/espace/preuves", label: "Preuves", icon: "↑" },
  { to: "/espace/documents", label: "Documents", icon: "▤" },
  { to: "/espace/factures", label: "Factures", icon: "◫" },
  { to: "/espace/devis", label: "Devis", icon: "◧" },
  { to: "/espace/messages", label: "Messages", icon: "✉" },
  { to: "/espace/notifications", label: "Notifications", icon: "●" },
  { to: "/espace/galerie-favoris", label: "Favoris", icon: "♥" },
  { to: "/espace/avis", label: "Mes avis", icon: "★" },
  { to: "/espace/invites", label: "Invités", icon: "☷" },
  { to: "/espace/profil", label: "Profil", icon: "◉" },
  { to: "/espace/preferences", label: "Préférences", icon: "⚙" },
  { to: "/espace/securite", label: "Sécurité", icon: "◉" },
  { to: "/espace/aide", label: "Aide", icon: "?" },
  { to: "/espace/payeur", label: "Payeur", icon: "◉" },
  
];

const mobileLinks = links.filter((link) =>
  [
    "/espace",
    "/espace/nouvelle-reservation",
    "/espace/reservations",
    "/espace/notifications",
    "/espace/profil",
  ].includes(link.to)
);

export default function ClientLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/connexion");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-foreground/15 bg-ivory p-6 dark:bg-black md:flex md:flex-col">
        <p className="text-xl font-bold text-gold">Les Deux Anneaux</p>

        <p className="mt-2 text-sm text-foreground/60">
          Bonjour, {user?.name}
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
        {link.label}
      </NavLink>
    ))}
  </div>
</nav>

        <button
  type="button"
  onClick={handleLogout}
  className="shrink-0 rounded-xl border border-red-700 px-4 py-3 text-left font-semibold text-red-700"
>
  Se déconnecter
</button>
      </aside>

      <section className="min-h-screen pb-24 md:ml-64 md:pb-0">
        <Outlet />
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-foreground/15 bg-ivory px-2 py-2 dark:bg-black md:hidden">
        {mobileLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/espace"}
            className={({ isActive }) =>
              `flex min-w-14 flex-col items-center rounded-lg px-2 py-1 text-xs ${
                isActive ? "text-gold" : "text-foreground/65"
              }`
            }
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}