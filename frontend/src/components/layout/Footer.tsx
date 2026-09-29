import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-black text-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <h2 className="font-serif text-2xl text-gold">Les Deux Anneaux</h2>

          <p className="mt-4 max-w-sm text-sm leading-6 text-ivory/70">
            Salle dînatoire pour mariages, fiançailles, réceptions familiales
            et événements professionnels.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-semibold">Navigation</h3>

          <div className="flex flex-col gap-2 text-sm text-ivory/70">
            <Link to="/la-salle">La salle</Link>
            <Link to="/services">Services</Link>
            <Link to="/packs-tarifs">Packs & tarifs</Link>
            <Link to="/galerie">Galerie</Link>
            <Link to="/avis">Avis</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-semibold">Réservation</h3>

          <p className="text-sm text-ivory/70">
            Réservation en ligne 24h/24, y compris pour les créneaux de nuit.
          </p>

          <Link
            to="/reservation"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-3 text-sm font-semibold text-black"
          >
            Réserver maintenant
          </Link>
        </div>

        <div>
          <h3 className="mb-4 font-semibold">Newsletter</h3>

          <p className="text-sm leading-6 text-ivory/70">
            Recevez nos actualités, offres et disponibilités.
          </p>

          <Link
            to="/newsletter"
            className="mt-4 inline-block rounded-full bg-gold px-5 py-3 text-sm font-semibold text-black"
          >
            S’inscrire à la newsletter
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 text-center text-sm text-ivory/50">
        © {new Date().getFullYear()} Les Deux Anneaux. Tous droits réservés.
      </div>
    </footer>
  );
}