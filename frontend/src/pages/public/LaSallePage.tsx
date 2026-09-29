import { useEffect, useState } from "react";
import { getVenueInfo, type VenueInfo } from "../../services/public-content.service";

export default function LaSallePage() {
  const [venue, setVenue] = useState<VenueInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVenueInfo()
      .then(setVenue)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-10">Chargement…</p>;
  }

  if (!venue) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="font-serif text-4xl">La salle</h1>
        <p className="mt-6 text-black/70">
          Les informations officielles sur la salle seront publiées après
          validation par Les Deux Anneaux.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-serif text-4xl">La salle</h1>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <p>Capacité femmes : {venue.womenCapacity}</p>
        <p>Capacité hommes : {venue.menCapacity}</p>
        <p>Parking : {venue.parking}</p>
        <p>Horaires : {venue.openingHours}</p>
      </div>

      <h2 className="mt-10 font-serif text-2xl">Espaces</h2>

      <ul className="mt-4 list-disc space-y-2 pl-6">
        {venue.spaces.map((space) => (
          <li key={space}>{space}</li>
        ))}
      </ul>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {venue.virtualVisitImages.map((image) => (
          <img
            key={image}
            src={image}
            alt="Visite virtuelle Les Deux Anneaux"
            className="rounded-2xl"
          />
        ))}
      </div>
    </main>
  );
}