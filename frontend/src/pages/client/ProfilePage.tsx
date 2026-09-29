import { useEffect, useState } from "react";
import {
  getMyProfile,
  updateMyProfile,
} from "../../services/profile.service";

function getUploadUrl(path?: string) {
  if (!path) return "";

  return `${String(import.meta.env.VITE_API_URL).replace(
    /\/api\/?$/,
    ""
  )}${path}`;
}

export default function ProfilePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        setForm({
          name: profile.name,
          email: profile.email,
          phone: profile.phone || "",
          country: profile.country || "",
        });
        setPhotoUrl(profile.profilePhotoUrl || "");
      })
      .catch(() => setMessage("Impossible de charger le profil."));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      const result = await updateMyProfile({
        ...form,
        photo,
      });

      setPhotoUrl(result.user.profilePhotoUrl || photoUrl);
      setPhoto(null);
      setMessage("Profil enregistré.");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d'enregistrer le profil."
      );
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Mon profil</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-foreground/15 p-6"
        >
          {photoUrl && (
            <img
              src={getUploadUrl(photoUrl)}
              alt="Photo de profil"
              className="h-24 w-24 rounded-full object-cover"
            />
          )}

          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={(event) =>
              setPhoto(event.target.files?.[0] || null)
            }
            className="mt-5 block w-full rounded-xl border border-foreground/20 p-3"
          />

          <div className="mt-6 grid gap-5">
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Nom"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="Email"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
              placeholder="Téléphone"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              required
              value={form.country}
              onChange={(event) =>
                setForm({ ...form, country: event.target.value })
              }
              placeholder="Pays de résidence"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="mt-6 rounded-xl bg-gold px-6 py-3 font-semibold text-black"
          >
            Enregistrer
          </button>
        </form>

        {message && <p className="mt-6">{message}</p>}
      </div>
    </main>
  );
}