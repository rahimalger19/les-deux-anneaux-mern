import { useEffect, useState } from "react";
import {
  getMyBookings,
  type ClientBooking,
} from "../../services/client-booking.service";
import {
  getMyGuestList,
  importMyGuestList,
  type GuestListResponse,
} from "../../services/guest-list.service";

export default function GuestListPage() {
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [data, setData] = useState<GuestListResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch(() => setMessage("Impossible de charger vos réservations."));
  }, []);

  async function selectBooking(id: string) {
    setBookingId(id);
    setData(null);

    if (!id) return;

    try {
      setData(await getMyGuestList(id));
    } catch {
      setMessage("Impossible de charger la liste d'invités.");
    }
  }

  async function handleImport() {
    if (!bookingId || !file) {
      setMessage("Choisissez une réservation et un fichier CSV.");
      return;
    }

    try {
      await importMyGuestList(bookingId, file);
      setFile(null);
      setData(await getMyGuestList(bookingId));
      setMessage("Liste d'invités importée.");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Impossible d'importer la liste."
      );
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Liste invités</h1>

        <p className="mt-4 text-foreground/70">
          Le fichier CSV doit contenir les colonnes :
          {" "}
          <strong>name,gender</strong>
          {" "}
          ou
          {" "}
          <strong>nom,sexe</strong>.
        </p>

        <select
          value={bookingId}
          onChange={(event) => void selectBooking(event.target.value)}
          className="mt-8 w-full rounded-xl border border-foreground/20 bg-transparent px-4 py-3"
        >
          <option value="">Choisir une réservation</option>

          {bookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              {booking.eventTypeKey} — {booking.eventDate}
            </option>
          ))}
        </select>

        {data && (
          <section className="mt-8 rounded-2xl border border-foreground/15 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <p>
                Femmes :{" "}
                <strong>
                  {data.guestList?.womenCount || 0} / {data.capacity.women}
                </strong>
              </p>

              <p>
                Hommes :{" "}
                <strong>
                  {data.guestList?.menCount || 0} / {data.capacity.men}
                </strong>
              </p>
            </div>

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) =>
                setFile(event.target.files?.[0] || null)
              }
              className="mt-6 block w-full rounded-xl border border-foreground/20 p-3"
            />

            <button
              type="button"
              onClick={() => void handleImport()}
              className="mt-4 rounded-xl bg-gold px-6 py-3 font-semibold text-black"
            >
              Importer le CSV
            </button>

            {data.guestList && (
              <ul className="mt-8 space-y-2">
                {data.guestList.entries.map((entry, index) => (
                  <li key={`${entry.name}-${index}`}>
                    {entry.name} —{" "}
                    {entry.gender === "WOMAN" ? "Femme" : "Homme"}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {message && <p className="mt-6">{message}</p>}
      </div>
    </main>
  );
}