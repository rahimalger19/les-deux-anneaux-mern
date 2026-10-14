import { Link } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-black text-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <h2 className="font-serif text-2xl text-gold">
            {t("brand.name")}
          </h2>

          <p className="mt-4 max-w-sm text-sm leading-6 text-ivory/70">
            {t("footer.description")}
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-semibold">{t("footer.navigation")}</h3>

          <div className="flex flex-col gap-2 text-sm text-ivory/70">
            <Link to="/la-salle">{t("nav.hall")}</Link>
            <Link to="/services">{t("nav.services")}</Link>
            <Link to="/packs-tarifs">{t("nav.pricing")}</Link>
            <Link to="/galerie">{t("nav.gallery")}</Link>
            <Link to="/avis">{t("nav.reviews")}</Link>
            <Link to="/contact">{t("nav.contact")}</Link>
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-semibold">{t("footer.reservation")}</h3>

          <p className="text-sm text-ivory/70">
            {t("footer.reservationDescription")}
          </p>

          <Link
            to="/reservation"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-3 text-sm font-semibold text-black"
          >
            {t("footer.bookNow")}
          </Link>
        </div>

        <div>
          <h3 className="mb-4 font-semibold">{t("footer.newsletter")}</h3>

          <p className="text-sm leading-6 text-ivory/70">
            {t("footer.newsletterDescription")}
          </p>

          <Link
            to="/newsletter"
            className="mt-4 inline-block rounded-full bg-gold px-5 py-3 text-sm font-semibold text-black"
          >
            {t("footer.subscribe")}
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 text-center text-sm text-ivory/50">
        © {new Date().getFullYear()} {t("brand.name")}.{" "}
        {t("footer.rights")}
      </div>
    </footer>
  );
}