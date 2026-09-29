export const translations = {
  "fr-DZ": {
    "nav.home": "Accueil",
    "nav.hall": "La salle",
    "nav.services": "Services",
    "nav.pricing": "Packs & tarifs",
    "nav.gallery": "Galerie",
    "nav.reviews": "Avis",
    "nav.contact": "Contact",
    "nav.book": "Réserver",

    "home.eyebrow": "Les Deux Anneaux",
    "home.title": "Une salle élégante pour vos moments inoubliables.",
    "home.description":
      "Mariages, fiançailles, réceptions familiales et événements professionnels. Réservez en ligne, y compris les créneaux de nuit.",
    "home.discoverHall": "Découvrir la salle",
  },

  en: {
    "nav.home": "Home",
    "nav.hall": "The venue",
    "nav.services": "Services",
    "nav.pricing": "Packages & pricing",
    "nav.gallery": "Gallery",
    "nav.reviews": "Reviews",
    "nav.contact": "Contact",
    "nav.book": "Book now",

    "home.eyebrow": "Les Deux Anneaux",
    "home.title": "An elegant venue for your unforgettable moments.",
    "home.description":
      "Weddings, engagements, family receptions and professional events. Book online, including night slots.",
    "home.discoverHall": "Discover the venue",
  },

  "ar-DZ": {
    "nav.home": "الرئيسية",
    "nav.hall": "القاعة",
    "nav.services": "الخدمات",
    "nav.pricing": "الباقات والأسعار",
    "nav.gallery": "المعرض",
    "nav.reviews": "الآراء",
    "nav.contact": "اتصل بنا",
    "nav.book": "احجز الآن",

    "home.eyebrow": "الأنواعين",
    "home.title": "قاعة أنيقة لمناسباتكم التي لا تنسى",
    "home.description":
      "أعراس، خطوبات، حفلات عائلية وفعاليات مهنية. احجز عبر الإنترنت، بما في ذلك المواعيد الليلية.",
    "home.discoverHall": "اكتشف القاعة",
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations["fr-DZ"];