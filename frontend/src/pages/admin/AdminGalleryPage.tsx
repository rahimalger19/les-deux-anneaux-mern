import { useEffect, useState, type FormEvent } from "react";
import { getEventTypes } from "../../services/catalog.service";
import type { EventType } from "../../types/catalog.types";
import {
  getAdminGalleryItems,
  hideAdminGalleryItem,
  updateAdminGalleryItem,
  updateAdminGalleryOrder,
  uploadAdminGalleryImages,
  type AdminGalleryItem,
} from "../../services/admin-gallery.service";

type GalleryEdit = {
  album: string;
  eventTypeKey: string;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  sortOrder: string;
};

export default function AdminGalleryPage() {
  const [items, setItems] = useState<AdminGalleryItem[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [edits, setEdits] = useState<Record<string, GalleryEdit>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [album, setAlbum] = useState("");
  const [eventTypeKey, setEventTypeKey] = useState("");
  const [titleFr, setTitleFr] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [message, setMessage] = useState("Chargement de la galerie...");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [galleryData, eventTypeData] = await Promise.all([
        getAdminGalleryItems(),
        getEventTypes(),
      ]);

      setItems(galleryData);
      setEventTypes(eventTypeData);

      setEdits(
        Object.fromEntries(
          galleryData.map((item) => [
            item.id,
            {
              album: item.album,
              eventTypeKey: item.eventTypeKey,
              titleFr: item.title.fr,
              titleAr: item.title.ar,
              titleEn: item.title.en,
              sortOrder: String(item.sortOrder),
            },
          ])
        )
      );

      setMessage("");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de charger la galerie."
      );
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function updateEdit(
    itemId: string,
    field: keyof GalleryEdit,
    value: string
  ) {
    setEdits((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        [field]: value,
      },
    }));
  }

   async function handleUpload(event: FormEvent) {
    event.preventDefault();

    if (
      files.length === 0 ||
      !album.trim() ||
      !eventTypeKey ||
      !titleFr.trim() ||
      !titleAr.trim() ||
      !titleEn.trim() ||
      !rightsConfirmed
    ) {
      setMessage(
        "Remplissez tous les champs, sélectionnez les images et confirmez les droits."
      );
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      files.forEach((file) => formData.append("images", file));
      formData.append("album", album.trim());
      formData.append("eventTypeKey", eventTypeKey);
      formData.append("titleFr", titleFr.trim());
      formData.append("titleAr", titleAr.trim());
      formData.append("titleEn", titleEn.trim());
      formData.append("imageRightsConfirmed", "true");

      const result = await uploadAdminGalleryImages(formData);

      setFiles([]);
      setAlbum("");
      setEventTypeKey("");
      setTitleFr("");
      setTitleAr("");
      setTitleEn("");
      setRightsConfirmed(false);
      setMessage(result.message);

      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d’envoyer les images."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveItem(item: AdminGalleryItem) {
    const edit = edits[item.id];

    if (!edit) {
      return;
    }

    try {
      setLoading(true);

      const result = await updateAdminGalleryItem(item.id, {
        album: edit.album.trim(),
        eventTypeKey: edit.eventTypeKey,
        titleFr: edit.titleFr.trim(),
        titleAr: edit.titleAr.trim(),
        titleEn: edit.titleEn.trim(),
        sortOrder: Number(edit.sortOrder),
      });

      setMessage(result.message);
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de mettre à jour l’image."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(item: AdminGalleryItem) {
    try {
      setLoading(true);

      const result = await updateAdminGalleryItem(item.id, {
        active: !item.active,
      });

      setMessage(result.message);
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de modifier la visibilité."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveOrder() {
    try {
      setLoading(true);

      const result = await updateAdminGalleryOrder(
        items.map((item) => ({
          id: item.id,
          sortOrder: Number(edits[item.id]?.sortOrder || 0),
        }))
      );

      setMessage(result.message);
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de modifier l’ordre."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleHide(itemId: string) {
    try {
      setLoading(true);

      const result = await hideAdminGalleryItem(itemId);

      setMessage(result.message);
      await loadData();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible de masquer l’image."
      );
    } finally {
      setLoading(false);
    }
  }

  const existingAlbums = Array.from(
  new Set(items.map((item) => item.album))
).sort((left, right) => left.localeCompare(right));

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">CMS galerie</h1>

        <form
          onSubmit={handleUpload}
          className="mt-8 rounded-2xl border border-foreground/15 p-6"
        >
          <h2 className="text-2xl font-bold">Ajouter des images</h2>

        <datalist id="gallery-albums">
  {existingAlbums.map((existingAlbum) => (
    <option key={existingAlbum} value={existingAlbum} />
  ))}
</datalist>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input
              value={album}
              list="gallery-albums"
              onChange={(event) => setAlbum(event.target.value)}
              placeholder="Nom de l’album"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <select
              value={eventTypeKey}
              onChange={(event) => setEventTypeKey(event.target.value)}
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            >
              <option value="">Type d’événement</option>

              {eventTypes.map((eventType) => (
                <option key={eventType.key} value={eventType.key}>
                  {eventType.name.fr}
                </option>
              ))}
            </select>

            <input
              value={titleFr}
              onChange={(event) => setTitleFr(event.target.value)}
              placeholder="Titre français"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              value={titleAr}
              onChange={(event) => setTitleAr(event.target.value)}
              placeholder="Titre arabe"
              dir="rtl"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
              placeholder="Titre anglais"
              className="rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
            />

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              onChange={(event) =>
                setFiles(Array.from(event.target.files || []))
              }
              className="rounded-xl border border-foreground/20 p-3"
            />
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={rightsConfirmed}
              onChange={(event) => setRightsConfirmed(event.target.checked)}
            />
            Je confirme que Les Deux Anneaux possède les droits de diffusion
            de ces images.
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 rounded-xl bg-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
          >
            Envoyer les images
          </button>
        </form>

        {message && <p className="mt-6">{message}</p>}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            disabled={loading || items.length === 0}
            onClick={() => void handleSaveOrder()}
            className="rounded-xl border border-foreground/20 px-5 py-3 font-semibold disabled:opacity-50"
          >
            Enregistrer tous les ordres
          </button>
        </div>

        <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const edit = edits[item.id];

            if (!edit) {
              return null;
            }

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-foreground/15"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title.fr}
                  className="h-56 w-full object-cover"
                />

                <div className="p-5">
                  <p className="text-sm text-gold">
                    ♥ {item.likeCount} ·{" "}
                    {item.active ? "Publié" : "Masqué"}
                  </p>

                  <div className="mt-4 grid gap-3">
                    <input
                      value={edit.album}
                      onChange={(event) =>
                        updateEdit(item.id, "album", event.target.value)
                      }
                      placeholder="Album"
                      className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                    />

                    <select
                      value={edit.eventTypeKey}
                      onChange={(event) =>
                        updateEdit(
                          item.id,
                          "eventTypeKey",
                          event.target.value
                        )
                      }
                      className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                    >
                      {eventTypes.map((eventType) => (
                        <option key={eventType.key} value={eventType.key}>
                          {eventType.name.fr}
                        </option>
                      ))}
                    </select>

                    <input
                      value={edit.titleFr}
                      onChange={(event) =>
                        updateEdit(item.id, "titleFr", event.target.value)
                      }
                      placeholder="Titre français"
                      className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                    />

                    <input
                      value={edit.titleAr}
                      dir="rtl"
                      onChange={(event) =>
                        updateEdit(item.id, "titleAr", event.target.value)
                      }
                      placeholder="Titre arabe"
                      className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                    />

                    <input
                      value={edit.titleEn}
                      onChange={(event) =>
                        updateEdit(item.id, "titleEn", event.target.value)
                      }
                      placeholder="Titre anglais"
                      className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                    />

                    <label className="text-sm">
                      Ordre d’affichage
                      <input
                        type="number"
                        min="0"
                        value={edit.sortOrder}
                        onChange={(event) =>
                          updateEdit(
                            item.id,
                            "sortOrder",
                            event.target.value
                          )
                        }
                        className="mt-1 w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2"
                      />
                    </label>
                  </div>

                  <p className="mt-4 text-sm text-foreground/65">
                    {item.imageRightsConfirmed
                      ? "Droits image confirmés"
                      : "Droits image non confirmés"}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handleSaveItem(item)}
                      className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                    >
                      Enregistrer
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handleToggleActive(item)}
                      className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {item.active ? "Masquer" : "Publier"}
                    </button>

                    {item.active && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void handleHide(item.id)}
                        className="rounded-xl border border-red-700 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}