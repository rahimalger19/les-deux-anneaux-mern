import { useEffect, useState } from "react";
import {
  getMyGalleryFavorites,
  removeMyGalleryFavorite,
  type GalleryFavorite,
} from "../../services/community.service";

export default function GalleryFavoritesPage() {
  const [favorites, setFavorites] = useState<GalleryFavorite[]>([]);
  const [message, setMessage] = useState("Chargement...");

  useEffect(() => {
    getMyGalleryFavorites()
      .then((data) => {
        setFavorites(data);
        setMessage(
          data.length === 0
            ? "Aucun favori enregistré pour le moment."
            : ""
        );
      })
      .catch(() => setMessage("Impossible de charger vos favoris."));
  }, []);

  async function removeFavorite(favoriteId: string) {
    await removeMyGalleryFavorite(favoriteId);
    setFavorites((current) =>
      current.filter((favorite) => favorite._id !== favoriteId)
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Favoris galerie</h1>

        {message && <p className="mt-8">{message}</p>}

        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => {
            const item = favorite.galleryItemId;

            return (
              <article
                key={favorite._id}
                className="overflow-hidden rounded-2xl border border-foreground/15"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title.fr}
                  className="h-60 w-full object-cover"
                />

                <div className="p-5">
                  <p className="text-sm text-gold">
                    Collection : {favorite.collection}
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    {item.title.fr}
                  </h2>

                  <button
                    type="button"
                    onClick={() => void removeFavorite(favorite._id)}
                    className="mt-5 rounded-xl border border-red-700 px-4 py-2 text-sm font-semibold text-red-700"
                  >
                    Retirer
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}