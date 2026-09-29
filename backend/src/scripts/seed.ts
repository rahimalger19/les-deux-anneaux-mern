import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { EventType, type Slot } from "../models/EventType";
import { Pack } from "../models/Pack";
import { PricingRule } from "../models/PricingRule";

dotenv.config();

const eventTypes = [
  {
    key: "wedding",
    name: { fr: "Mariage", ar: "زفاف", en: "Wedding" },
    description: {
      fr: "Une réception de mariage élégante et personnalisée.",
      ar: "حفل زفاف أنيق ومخصص.",
      en: "An elegant and personalised wedding reception.",
    },
    womenCapacity: 250,
    menCapacity: 250,
    durationHours: 8,
    allowedSlots: ["AFTERNOON", "EVENING", "NIGHT", "DAY"],
    recommendedPackKey: "prestige",
    depositPercent: 30,
    active: true,
    coverImage: "/images/events/event-wedding.jpg",
  },
  {
    key: "engagement",
    name: { fr: "Fiançailles", ar: "خطوبة", en: "Engagement" },
    description: {
      fr: "Une célébration raffinée pour vos fiançailles.",
      ar: "احتفال راقٍ لخطوبتكم.",
      en: "A refined celebration for your engagement.",
    },
    womenCapacity: 200,
    menCapacity: 200,
    durationHours: 6,
    allowedSlots: ["AFTERNOON", "EVENING", "NIGHT"],
    recommendedPackKey: "elegance",
    depositPercent: 30,
    active: true,
    coverImage: "/images/events/event-engagement.jpg",
  },
  {
    key: "khatana",
    name: {
  fr: "Khitana / circoncision",
  ar: "ختان",
  en: "Khitana / circumcision",
},
    description: {
      fr: "Organisation d'une cérémonie de khatana.",
      ar: "تنظيم حفل ختان.",
      en: "Khatana ceremony organisation.",
    },
    womenCapacity: 180,
    menCapacity: 180,
    durationHours: 5,
    allowedSlots: ["AFTERNOON", "EVENING"],
    recommendedPackKey: "essentiel",
    depositPercent: 25,
    active: true,
    coverImage: "/images/events/event-khitana.jpg",
  },
  {
    key: "graduation",
    name: { fr: "Graduation", ar: "تخرج", en: "Graduation" },
    description: {
      fr: "Célébrez une réussite académique.",
      ar: "احتفلوا بالنجاح الأكاديمي.",
      en: "Celebrate an academic achievement.",
    },
    womenCapacity: 200,
    menCapacity: 200,
    durationHours: 5,
    allowedSlots: ["AFTERNOON", "EVENING"],
    recommendedPackKey: "essentiel",
    depositPercent: 25,
    active: true,
    coverImage: "/images/events/event-graduation.jpg",
  },
  {
    key: "birthday",
    name: { fr: "Anniversaire", ar: "عيد ميلاد", en: "Birthday" },
    description: {
      fr: "Une fête d'anniversaire mémorable.",
      ar: "حفلة عيد ميلاد لا تنسى.",
      en: "A memorable birthday celebration.",
    },
    womenCapacity: 150,
    menCapacity: 150,
    durationHours: 5,
    allowedSlots: ["AFTERNOON", "EVENING", "NIGHT"],
    recommendedPackKey: "essentiel",
    depositPercent: 25,
    active: true,
    coverImage: "/images/events/event-birthday.jpg",
  },
  {
    key: "aqiqah",
 name: {
  fr: "Aqiqah / baptême",
  ar: "عقيقة / معمودية",
  en: "Aqiqah / baptism",
},
    description: {
      fr: "Une réception familiale chaleureuse.",
      ar: "استقبال عائلي دافئ.",
      en: "A warm family reception.",
    },
    womenCapacity: 150,
    menCapacity: 150,
    durationHours: 5,
    allowedSlots: ["AFTERNOON", "EVENING"],
    recommendedPackKey: "essentiel",
    depositPercent: 25,
    active: true,
    coverImage: "/images/events/event-aqiqah.jpg",
  },
  {
    key: "family-reception",
    name: { fr: "Réception familiale", ar: "استقبال عائلي", en: "Family reception" },
    description: {
      fr: "Un moment convivial en famille.",
      ar: "لحظة عائلية مميزة.",
      en: "A friendly family occasion.",
    },
    womenCapacity: 180,
    menCapacity: 180,
    durationHours: 5,
    allowedSlots: ["AFTERNOON", "EVENING", "NIGHT"],
    recommendedPackKey: "elegance",
    depositPercent: 25,
    active: true,
    coverImage: "/images/events/event-family.jpg",
  },
  {
    key: "seminar",
    name: {
  fr: "Séminaire / entreprise",
  ar: "ندوة / شركة",
  en: "Seminar / business",
},
    description: {
      fr: "Un espace adapté aux événements professionnels.",
      ar: "فضاء ملائم للفعاليات المهنية.",
      en: "A venue for professional events.",
    },
    womenCapacity: 200,
    menCapacity: 200,
    durationHours: 8,
    allowedSlots: ["AFTERNOON", "EVENING", "DAY"],
    recommendedPackKey: "elegance",
    depositPercent: 40,
    active: true,
    coverImage: "/images/events/event-seminar.jpg",
  },
  {
    key: "other",
    name: { fr: "Autre événement", ar: "مناسبة أخرى", en: "Other event" },
    description: {
      fr: "Créez un événement sur mesure.",
      ar: "أنشئوا مناسبة حسب الطلب.",
      en: "Create a custom event.",
    },
    womenCapacity: 150,
    menCapacity: 150,
    durationHours: 5,
    allowedSlots: ["AFTERNOON", "EVENING", "NIGHT", "DAY"],
    recommendedPackKey: "elegance",
    depositPercent: 30,
    active: true,
    coverImage: "/images/events/event-other.jpg",
  },
];

const packs = [
  {
    key: "essentiel",
    name: { fr: "Essentiel", ar: "الأساسي", en: "Essential" },
    description: {
      fr: "Une formule simple et élégante.",
      ar: "باقة بسيطة وأنيقة.",
      en: "A simple and elegant package.",
    },
    basePriceDZD: 180000,
    extraGuestPriceDZD: 1200,
    includedGuests: 150,
    includedItems: ["Salle", "Tables", "Chaises", "Éclairage standard"],
    active: true,
  },
  {
    key: "elegance",
    name: { fr: "Élégance", ar: "الأناقة", en: "Elegance" },
    description: {
      fr: "Une formule complète pour votre réception.",
      ar: "باقة متكاملة لاستقبالكم.",
      en: "A complete package for your reception.",
    },
    basePriceDZD: 280000,
    extraGuestPriceDZD: 1600,
    includedGuests: 150,
    includedItems: ["Salle", "Décoration", "Sono", "Éclairage", "Staff"],
    active: true,
  },
  {
    key: "prestige",
    name: { fr: "Prestige", ar: "الفخامة", en: "Prestige" },
    description: {
      fr: "Une expérience haut de gamme personnalisée.",
      ar: "تجربة فاخرة ومخصصة.",
      en: "A personalised premium experience.",
    },
    basePriceDZD: 420000,
    extraGuestPriceDZD: 2200,
    includedGuests: 150,
    includedItems: [
      "Salle",
      "Décoration premium",
      "Scène",
      "Sono premium",
      "Éclairage premium",
      "Staff",
    ],
    active: true,
  },
];

type PricingRuleSeed = {
  market: "RESIDENT" | "DIASPORA";
  slot: Slot;
  season: "LOW" | "NORMAL" | "HIGH";
  minGuests: number;
  maxGuests: number;
  priceDZD: number;
  active: boolean;
};

const pricingRules: PricingRuleSeed[] = [
  { market: "RESIDENT", slot: "AFTERNOON", season: "NORMAL", minGuests: 1, maxGuests: 500, priceDZD: 180000, active: true },
  { market: "RESIDENT", slot: "EVENING", season: "NORMAL", minGuests: 1, maxGuests: 500, priceDZD: 220000, active: true },
  { market: "RESIDENT", slot: "NIGHT", season: "NORMAL", minGuests: 1, maxGuests: 500, priceDZD: 250000, active: true },
  { market: "RESIDENT", slot: "DAY", season: "NORMAL", minGuests: 1, maxGuests: 500, priceDZD: 300000, active: true },
];

async function seed() {
  try {
    await connectDatabase();

    for (const eventType of eventTypes) {
      await EventType.updateOne(
        { key: eventType.key },
        { $set: eventType },
        { upsert: true }
      );
    }

    for (const pack of packs) {
      await Pack.updateOne(
        { key: pack.key },
        { $set: pack },
        { upsert: true }
      );
    }

    for (const pricingRule of pricingRules) {
      await PricingRule.updateOne(
        {
          slot: pricingRule.slot,
          season: pricingRule.season,
          
        },
        { $set: pricingRule },
        { upsert: true }
      );
    }

    console.log("Catalogue seed completed successfully.");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();