import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminClients,
  type AdminClient,
} from "../../services/admin-client.service";

function formatDate(value: string | null) {
  if (!value) {
    return "Aucune réservation";
  }

  return new Intl.DateTimeFormat("fr-DZ", {
    dateStyle: "medium",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Chargement des clients...");

  async function loadClients(value = search) {
    try {
      const data = await getAdminClients(value.trim() || undefined);

      setClients(data);
      setMessage(
        data.length === 0
          ? "Aucun client ne correspond à votre recherche."
          : ""
      );
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de charger les clients."
      );
    }
  }

  useEffect(() => {
    void loadClients("");
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Fiches clients</h1>

        <div className="mt-8 flex gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void loadClients();
              }
            }}
            placeholder="Nom, email ou téléphone"
            className="min-w-0 flex-1 rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
          />

          <button
            type="button"
            onClick={() => void loadClients()}
            className="rounded-xl bg-gold px-5 py-3 font-semibold text-black"
          >
            Rechercher
          </button>
        </div>

        {message && <p className="mt-6">{message}</p>}

        <section className="mt-8 space-y-4">
          {clients.map((client) => (
            <Link
              key={`${client.kind}-${client.id}`}
              to={`/admin/clients/${client.kind}/${encodeURIComponent(
                client.id
              )}`}
              className="block rounded-2xl border border-foreground/15 p-6 transition hover:border-gold"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{client.name}</p>

                  <p className="mt-1 text-sm text-foreground/70">
                    {client.phone || client.email || "Contact indisponible"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-foreground/10 px-3 py-1">
                    {client.kind === "USER"
                      ? "Compte client"
                      : "Guest OTP"}
                  </span>

                  {client.diaspora && (
                    <span className="rounded-full bg-gold px-3 py-1 text-black">
                      Diaspora
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-4 text-sm text-foreground/70">
                {client.bookingCount} réservation(s) · Dernière :{" "}
                {formatDate(client.lastBookingAt)}
              </p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}