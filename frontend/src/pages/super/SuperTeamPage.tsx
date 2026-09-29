import { useEffect, useState } from "react";
import {
  createSuperTeamUser,
  getSuperTeam,
  updateSuperTeamUserRole,
  type StaffRole,
  type SuperTeamUser,
} from "../../services/super-team.service";

const roles: Array<{
  value: StaffRole;
  label: string;
}> = [
  { value: "RECEPTION", label: "Réception" },
  { value: "MANAGER", label: "Manager" },
  { value: "COMPTA", label: "Comptabilité" },
  { value: "READONLY", label: "Lecture seule" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export default function SuperTeamPage() {
  const [users, setUsers] = useState<SuperTeamUser[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "RECEPTION" as StaffRole,
  });
  const [message, setMessage] = useState("Chargement de l’équipe...");
  const [loading, setLoading] = useState(false);

  async function loadTeam() {
    try {
      const data = await getSuperTeam();

      setUsers(data);
      setMessage("");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de charger l’équipe."
      );
    }
  }

  useEffect(() => {
    void loadTeam();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);

      const result = await createSuperTeamUser({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
      });

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "RECEPTION",
      });

      setMessage(result.message);
      await loadTeam();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de créer le compte."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(
    userId: string,
    role: StaffRole
  ) {
    try {
      setLoading(true);

      const result = await updateSuperTeamUserRole(userId, role);

      setMessage(result.message);
      await loadTeam();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de modifier le rôle."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Super administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Équipe et rôles</h1>

        <form
          onSubmit={handleCreate}
          className="mt-8 rounded-2xl border border-foreground/15 p-6"
        >
          <h2 className="text-2xl font-bold">Créer un compte équipe</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Nom complet"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="Email"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              type="tel"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              placeholder="Téléphone optionnel"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="Mot de passe temporaire (8 caractères minimum)"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <select
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as StaffRole,
                }))
              }
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 rounded-xl bg-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
          >
            Créer le compte
          </button>
        </form>

        {message && <p className="mt-6">{message}</p>}

        <section className="mt-8 overflow-x-auto rounded-2xl border border-foreground/15">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-foreground/15 text-foreground/65">
              <tr>
                <th className="p-4">Nom</th>
                <th className="p-4">Email</th>
                <th className="p-4">Téléphone</th>
                <th className="p-4">Rôle</th>
                <th className="p-4">Créé le</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-foreground/10 last:border-0"
                >
                  <td className="p-4 font-semibold">{user.name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">{user.phone || "—"}</td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      disabled={loading}
                      onChange={(event) =>
                        void handleRoleChange(
                          user.id,
                          event.target.value as StaffRole
                        )
                      }
                      className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}