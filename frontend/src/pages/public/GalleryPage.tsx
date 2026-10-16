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
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
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
  try {
    const result = await likeGalleryItem(itemId);

    setItems((current) =>
      current.map((item) =>
        item._id === itemId
          ? { ...item, likeCount: result.likeCount }
          : item
      )
    );

    setLikedIds((current) => {
      const next = new Set(current);

      if (result.liked) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }

      return next;
    });

    if (selected?._id === itemId) {
      setSelected((current) =>
        current
          ? { ...current, likeCount: result.likeCount }
          : null
      );
    }
  } catch {
     window.alert(t("gallery.likeError"));  }
}

  async function handleFavorite(itemId: string) {
    if (!user) {
      window.alert(t("gallery.loginToFavorite"));
      return;
    }

    try {
      await addMyGalleryFavorite(itemId);
      window.alert(t("gallery.favoriteAdded"));
    } catch {
      window.alert(t("gallery.favoriteError"));
    }
  }

  
return (
  <main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-7xl px-6 py-16">
      {/* Page heading */}
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
        {t("gallery.eyebrow")}
      </p>

      <h1 className="mt-3 font-serif text-4xl text-foreground">
        {t("gallery.title")}
      </h1>

      <div className="mt-5 h-px w-16 bg-gold" />

      {/* Filters by event type */}
      <section aria-label="Filtres par type d'événement">
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void selectFilter("")}
            className={
              selectedEventType === ""
                ? "rounded-full border border-gold bg-gold px-5 py-3 font-semibold text-black transition-colors"
                : "rounded-full border border-foreground/20 bg-surface px-5 py-3 text-foreground transition-colors hover:border-gold hover:text-gold"
            }
          >
            {t("gallery.all")}
          </button>

          {eventTypes.map((eventType) => (
            <button
              key={eventType.key}
              type="button"
              onClick={() => void selectFilter(eventType.key)}
              className={
                selectedEventType === eventType.key
                  ? "rounded-full border border-gold bg-gold px-5 py-3 font-semibold text-black transition-colors"
                  : "rounded-full border border-foreground/20 bg-surface px-5 py-3 text-foreground transition-colors hover:border-gold hover:text-gold"
              }
            >
              {eventType.name[locale]}
            </button>
          ))}
        </div>
      </section>

      {/* Filters by album */}
      {albums.length > 0 && (
        <section
          aria-label="Filtres par album"
          className="mt-5 border-b border-foreground/10 pb-6"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            {t("gallery.allAlbums")}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void selectAlbum("")}
              className={
                selectedAlbum === ""
                  ? "rounded-lg bg-gold/15 px-4 py-2.5 text-sm font-semibold text-gold"
                  : "rounded-lg px-4 py-2.5 text-sm text-foreground/75 transition-colors hover:bg-surface hover:text-gold"
              }
            >
              {t("gallery.allAlbums")}
            </button>

            {albums.map((album) => (
              <button
                key={album.album}
                type="button"
                onClick={() => void selectAlbum(album.album)}
                className={
                  selectedAlbum === album.album
                    ? "rounded-lg bg-gold/15 px-4 py-2.5 text-sm font-semibold text-gold"
                    : "rounded-lg px-4 py-2.5 text-sm text-foreground/75 transition-colors hover:bg-surface hover:text-gold"
                }
              >
                {album.album}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Gallery content */}
      {items.length === 0 ? (
        <p className="mt-10 rounded-xl border border-foreground/15 bg-surface p-6 text-foreground/75">
          {t("gallery.empty")}
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item._id}
              className="group overflow-hidden rounded-2xl border border-foreground/10 bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-gold/50"
            >
              {/* Gallery image */}
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="block w-full overflow-hidden"
                aria-label={`${t("gallery.open")} ${item.title[locale]}`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title[locale]}
                  loading="lazy"
                  className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] sm:h-72"
                />
              </button>

              {/* Card details */}
              <div className="p-5">
                <p className="text-sm font-medium text-gold">
                  {item.album}
                </p>

                <h2 className="mt-2 font-serif text-xl text-foreground">
                  {item.title[locale]}
                </h2>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleLike(item._id)}
                    aria-pressed={likedIds.has(item._id)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      likedIds.has(item._id)
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-foreground/20 text-foreground hover:border-gold hover:text-gold"
                    }`}
                  >
                    {likedIds.has(item._id) ? "♥" : "♡"}{" "}
                    {item.likeCount}
                  </button>

                  {user && (
                    <button
                      type="button"
                      onClick={() => void handleFavorite(item._id)}
                      className="rounded-full border border-foreground/20 px-4 py-2 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
                    >
                      {t("gallery.addFavorite")}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Image modal */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title[locale]}
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-5 top-5 rounded-full border border-white/20 bg-espresso px-5 py-3 font-semibold text-ivory transition-colors hover:border-gold hover:text-gold sm:right-6 sm:top-6"
          >
            {t("gallery.close")} ✕
          </button>

          <div
            className="max-h-full w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-surface p-4 sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selected.imageUrl}
              alt={selected.title[locale]}
              className="mx-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gold">{selected.album}</p>

                <h2 className="mt-1 font-serif text-xl text-foreground">
                  {selected.title[locale]}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void handleLike(selected._id)}
                aria-pressed={likedIds.has(selected._id)}
                className="rounded-full border border-foreground/20 px-4 py-2 text-foreground transition-colors hover:border-gold hover:text-gold"
              >
                {likedIds.has(selected._id) ? "♥" : "♡"}{" "}
                {selected.likeCount}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  </main>
);
}