import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { to: "/super", label: "Tableau de bord" },
  { to: "/super/equipe", label: "Équipe et rôles" },
  { to: "/super/tarifs", label: "Tarifs et capacités" },
  { to: "/super/packs", label: "Packs et options" },
  { to: "/super/devises", label: "Devises et diaspora" },
  { to: "/super/marque", label: "Marque et paiements" },
  { to: "/super/smtp", label: "SMTP et e-mails" },
  { to: "/super/sms", label: "SMS et OTP" },
  { to: "/super/newsletter", label: "Newsletter" },
  { to: "/super/partenaires", label: "Partenaires" },
  { to: "/super/tracking", label: "Analytics" },
  { to: "/super/systeme", label: "Système et sauvegardes" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    navigate("/", { replace: true });
    void logout();
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <aside className="border-r border-foreground/15 bg-ivory p-6 dark:bg-black md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:flex md:flex-col">
        <div>
          <p className="text-xl font-bold text-gold">Les Deux Anneaux</p>
          <p className="mt-2 text-sm font-semibold">Super Administration</p>
          <p className="mt-1 text-sm text-foreground/60">
            {user?.name}
          </p>
        </div>

        <nav className="mt-8 min-h-0 flex-1 overflow-y-auto pr-2">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/admin"}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 transition ${
                    isActive
                      ? "bg-gold font-semibold text-black"
                      : "hover:bg-foreground/10"
                  }`
                }
              >
                {link.label}
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
            className="mt-2 w-full rounded-xl border border-red-700 px-4 py-3 text-left font-semibold text-red-700"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}