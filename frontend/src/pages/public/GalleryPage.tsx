
import { useEffect, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { getEventTypes } from "../../services/catalog.service";
import {
  addMyGalleryFavorite,
  getGalleryAlbums,
  getGalleryItems,
  likeGalleryItem,
  type GalleryItem,
  type GalleryAlbum,
} from "../../services/community.service";
import type { EventType } from "../../types/catalog.types";
import { useAuth } from "../../hooks/useAuth";

export default function GalleryPage() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [selectedEventType, setSelectedEventType] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState("");

  const locale =
    language === "fr-DZ" ? "fr" : language === "ar-DZ" ? "ar" : "en";

  async function loadGallery(eventType = "", album = "") {
    const galleryItems = await getGalleryItems(
      eventType || undefined,
      album || undefined
    );

    setItems(galleryItems);
  }

  useEffect(() => {
    getEventTypes().then(setEventTypes);
    getGalleryAlbums().then(setAlbums);
    void loadGallery();
  }, []);

  
async function selectFilter(eventTypeKey: string) {
  setSelectedEventType(eventTypeKey);
  setSelectedAlbum("");

  const [galleryItems, galleryAlbums] = await Promise.all([
    getGalleryItems(eventTypeKey || undefined),
    getGalleryAlbums(eventTypeKey || undefined),
  ]);

  setItems(galleryItems);
  setAlbums(galleryAlbums);
}


  async function selectAlbum(album: string) {
    setSelectedAlbum(album);
    await loadGallery(selectedEventType, album);
  }

  async function handleLike(itemId: string) {
    const result = await likeGalleryItem(itemId);

    setItems((current) =>
      current.map((item) =>
        item._id === itemId
          ? { ...item, likeCount: result.likeCount }
          : item
      )
    );

    if (selected?._id === itemId) {
      setSelected({
        ...selected,
        likeCount: result.likeCount,
      });
    }
  }

  async function handleFavorite(itemId: string) {
    if (!user) {
      window.alert("Connectez-vous pour enregistrer un favori.");
      return;
    }

    try {
      await addMyGalleryFavorite(itemId);
      window.alert("Ajouté à vos favoris.");
    } catch {
      window.alert("Impossible d'ajouter ce favori.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
        Galerie
      </p>

      <h1 className="mt-3 font-serif text-4xl">
        Nos événements en images
      </h1>

      {/* Filtres par type d'événement */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void selectFilter("")}
          className={
            selectedEventType === ""
              ? "rounded-full bg-black px-5 py-3 font-semibold text-ivory"
              : "rounded-full border border-black/20 px-5 py-3"
          }
        >
          Tous
        </button>

        {eventTypes.map((eventType) => (
          <button
            key={eventType.key}
            type="button"
            onClick={() => void selectFilter(eventType.key)}
            className={
              selectedEventType === eventType.key
                ? "rounded-full bg-black px-5 py-3 font-semibold text-ivory"
                : "rounded-full border border-black/20 px-5 py-3"
            }
          >
            {eventType.name[locale]}
          </button>
        ))}
      </div>

      {/* Filtres par album */}
      {albums.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void selectAlbum("")}
            className={
              selectedAlbum === ""
                ? "rounded-full bg-black px-5 py-3 font-semibold text-ivory"
                : "rounded-full border border-black/20 px-5 py-3"
            }
          >
            Tous les albums
          </button>

          {albums.map((album) => (
            <button
              key={album.album}
              type="button"
              onClick={() => void selectAlbum(album.album)}
              className={
                selectedAlbum === album.album
                  ? "rounded-full bg-black px-5 py-3 font-semibold text-ivory"
                  : "rounded-full border border-black/20 px-5 py-3"
              }
            >
              {album.album}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-10 rounded-xl border border-black/10 p-6 text-black/70">
          Aucun album publié pour ce type d’événement.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item._id}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white"
            >
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="block w-full"
                aria-label={`Ouvrir ${item.title[locale]}`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title[locale]}
                  className="h-72 w-full object-cover"
                />
              </button>

              <div className="p-5">
                <p className="text-sm text-gold">{item.album}</p>

                <h2 className="mt-1 font-serif text-xl">
                  {item.title[locale]}
                </h2>

                <button
                  type="button"
                  onClick={() => void handleLike(item._id)}
                  className="mt-4 rounded-full border border-black/15 px-4 py-2 text-sm"
                >
                  ♥ {item.likeCount}
                </button>

                {user && (
                  <button
                    type="button"
                    onClick={() => void handleFavorite(item._id)}
                    className="ml-3 mt-4 rounded-full border border-black/15 px-4 py-2 text-sm"
                  >
                    Ajouter aux favoris
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {selected ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-6"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-6 top-6 rounded-full bg-white px-5 py-3 font-semibold text-black"
          >
            Fermer
          </button>

          <div className="max-h-full max-w-5xl">
            <img
              src={selected.imageUrl}
              alt={selected.title[locale]}
              className="max-h-[80vh] w-auto rounded-2xl"
            />

            <div className="mt-4 flex items-center justify-between text-ivory">
              <p className="font-serif text-xl">
                {selected.title[locale]}
              </p>

              <button
                type="button"
                onClick={() => void handleLike(selected._id)}
                className="rounded-full border border-ivory/40 px-4 py-2"
              >
                ♥ {selected.likeCount}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

