import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { Faq } from "../models/Faq";
import { Service } from "../models/Service";
import { VenueInfo } from "../models/VenueInfo";

dotenv.config();

const venue = {
  womenCapacity: 250,
  menCapacity: 250,

  spaces: [
    "Main dining hall",
    "Bride & groom room",
    "Reception area",
    "Stage area",
    "Service area",
  ],

  parking: "Private parking - Capacity: 80 vehicles",

  openingHours:
    "Sunday - Thursday: 09:00 - 23:00\nFriday - Saturday: 09:00 - 00:00\nNight events: 00:00 - 06:00",

  virtualVisitImages: [
    "/images/venue/hall-main.jpg",
    "/images/venue/hall-stage.jpg",
    "/images/venue/hall-tables.jpg",
    "/images/venue/bride-room.jpg",
    "/images/venue/hall-entrance.jpg",
    "/images/venue/hall-parking.jpg",
  ],

  published: true,
};

const services = [
  {
    key: "hall-rental",
    category: "VENUE",
    name: {
      fr: "Location de la salle",
      ar: "كراء القاعة",
      en: "Hall Rental",
    },
    description: {
      fr: "Location de la salle principale pour mariages, fiançailles, réceptions et événements privés ou professionnels.",
      ar: "كراء القاعة الرئيسية لإقامة حفلات الزواج والخطوبة والاستقبالات العائلية والمناسبات الخاصة والمهنية.",
      en: "Rental of the main hall for weddings, engagements, family receptions, and private or professional events.",
    },
    priceDZD: 180000,
    image: "/images/services/service-hall.jpg",
    active: true,
  },
  {
    key: "bride-groom-room",
    category: "SALON",
    name: {
      fr: "Espace mariés",
      ar: "جناح العروسين",
      en: "Bride & Groom Room",
    },
    description: {
      fr: "Espace privé réservé aux mariés pour se préparer et se détendre pendant l'événement.",
      ar: "فضاء خاص مخصص للعروسين للتحضير والاستراحة أثناء المناسبة.",
      en: "A private space for the bride and groom to prepare and relax during the event.",
    },
    priceDZD: 25000,
    image: "/images/services/service-bride-room.jpg",
    active: true,
  },
  {
    key: "stage-rental",
    category: "STAGE",
    name: {
      fr: "Mise à disposition de la scène",
      ar: "توفير المنصة",
      en: "Stage Rental",
    },
    description: {
      fr: "Mise à disposition d'une scène adaptée aux cérémonies, présentations et animations.",
      ar: "توفير منصة مناسبة للحفلات والعروض والتقديمات والأنشطة.",
      en: "A stage suitable for ceremonies, presentations, and entertainment.",
    },
    priceDZD: 30000,
    image: "/images/services/service-stage.jpg",
    active: true,
  },
  {
    key: "sound-system",
    category: "SOUND",
    name: {
      fr: "Sonorisation",
      ar: "نظام الصوت",
      en: "Sound System",
    },
    description: {
      fr: "Système de sonorisation pour musique, annonces et animations pendant l'événement.",
      ar: "نظام صوتي للموسيقى والإعلانات والتنشيط أثناء المناسبة.",
      en: "A sound system for music, announcements, and entertainment during the event.",
    },
    priceDZD: 40000,
    image: "/images/services/service-sound.jpg",
    active: true,
  },
  {
    key: "event-staff",
    category: "STAFF",
    name: {
      fr: "Personnel de service",
      ar: "طاقم الخدمة",
      en: "Event Staff",
    },
    description: {
      fr: "Personnel dédié à l'accueil et au service des invités pendant l'événement.",
      ar: "طاقم مخصص لاستقبال الضيوف وتقديم الخدمة أثناء المناسبة.",
      en: "Dedicated staff for guest reception and event service.",
    },
    priceDZD: 35000,
    image: "/images/services/service-staff.jpg",
    active: true,
  },
  {
    key: "table-decoration",
    category: "OPTION",
    name: {
      fr: "Décoration de table",
      ar: "تزيين الطاولات",
      en: "Table Decoration",
    },
    description: {
      fr: "Décoration élégante des tables adaptée au thème de l'événement.",
      ar: "تزيين أنيق للطاولات يتناسب مع موضوع وأجواء المناسبة.",
      en: "Elegant table decoration adapted to the event theme.",
    },
    priceDZD: 20000,
    image: "/images/services/service-decoration.jpg",
    active: true,
  },
  {
    key: "decorative-lighting",
    category: "OPTION",
    name: {
      fr: "Éclairage décoratif",
      ar: "الإضاءة الديكورية",
      en: "Decorative Lighting",
    },
    description: {
      fr: "Éclairage décoratif pour créer une ambiance adaptée à votre événement.",
      ar: "إضاءة ديكورية لخلق أجواء مناسبة للمناسبة.",
      en: "Decorative lighting to create an atmosphere suited to your event.",
    },
    priceDZD: 25000,
    image: "/images/services/service-lighting.jpg",
    active: true,
  },
];

const faqs = [
  {
    key: "PRICE",
    question: {
      fr: "Quels sont les tarifs ?",
      ar: "ما هي الأسعار؟",
      en: "What are the prices?",
    },
    answer: {
      fr: "Nos tarifs dépendent du type d'événement, du créneau, du nombre d'invités et des services sélectionnés. Les prix sont affichés en DZD et peuvent être estimés directement depuis notre plateforme.",
      ar: "تختلف الأسعار حسب نوع المناسبة والفترة الزمنية وعدد الضيوف والخدمات المختارة. يتم عرض الأسعار بالدينار الجزائري ويمكن تقدير التكلفة مباشرة عبر المنصة.",
      en: "Prices depend on the event type, time slot, number of guests, and selected services. Prices are displayed in DZD and can be estimated directly through our platform.",
    },
    active: true,
  },
  {
    key: "NIGHT",
    question: {
      fr: "Puis-je réserver la nuit ?",
      ar: "هل يمكن الحجز ليلًا؟",
      en: "Can I book at night?",
    },
    answer: {
      fr: "Oui. La réservation de nuit est disponible en ligne sur le créneau 00h-06h, selon les disponibilités de la salle et les conditions applicables.",
      ar: "نعم. يمكن حجز القاعة ليلًا عبر الموقع خلال الفترة من 00:00 إلى 06:00، حسب توفر القاعة والشروط المطبقة.",
      en: "Yes. Night booking is available online from 00:00 to 06:00, subject to venue availability and applicable conditions.",
    },
    active: true,
  },
  {
    key: "CCP",
    question: {
      fr: "Comment payer par CCP ?",
      ar: "كيف يتم الدفع عبر CCP؟",
      en: "How can I pay by CCP?",
    },
    answer: {
      fr: "Le paiement par CCP est disponible selon les instructions de paiement communiquées lors de la réservation. Les coordonnées officielles du compte et le motif de paiement sont affichés avant le règlement.",
      ar: "الدفع عبر CCP متاح وفق تعليمات الدفع التي يتم تقديمها أثناء الحجز. يتم عرض معلومات الحساب الرسمية وسبب الدفع قبل إجراء عملية الدفع.",
      en: "Payment by CCP is available according to the payment instructions provided during the booking process. The official account details and payment reference are displayed before payment.",
    },
    active: true,
  },
  {
    key: "DIASPORA",
    question: {
      fr: "Comment fonctionne la réservation diaspora ?",
      ar: "كيف يعمل حجز الجالية في الخارج؟",
      en: "How does diaspora booking work?",
    },
    answer: {
      fr: "Les clients résidant à l'étranger peuvent effectuer une réservation en ligne. Une grille tarifaire diaspora peut être appliquée et un proche en Algérie peut être désigné comme payeur lorsque cela est nécessaire.",
      ar: "يمكن للعملاء المقيمين في الخارج إجراء الحجز عبر الإنترنت. ويمكن تطبيق تسعيرة خاصة بالـDiaspora، كما يمكن تعيين شخص قريب في الجزائر كدافع عند الحاجة.",
      en: "Clients living abroad can make a booking online. A separate diaspora pricing grid may apply, and a relative or trusted person in Algeria can be designated as the local payer when necessary.",
    },
    active: true,
  },
  {
    key: "CANCELLATION",
    question: {
      fr: "Comment fonctionne l'annulation ?",
      ar: "كيف يتم إلغاء الحجز؟",
      en: "How does cancellation work?",
    },
    answer: {
      fr: "Toute demande d'annulation doit être effectuée avant l'événement. Les conditions de remboursement dépendent de la date d'annulation et du statut du paiement. Les frais éventuellement non remboursables sont indiqués lors de la réservation.",
      ar: "يجب تقديم طلب إلغاء الحجز قبل موعد المناسبة. تعتمد شروط استرجاع المبلغ على تاريخ الإلغاء وحالة الدفع. ويتم توضيح أي رسوم غير قابلة للاسترداد عند إجراء الحجز.",
      en: "Cancellation requests must be submitted before the event. Refund conditions depend on the cancellation date and payment status. Any non-refundable fees are clearly indicated during the booking process.",
    },
    active: true,
  },
];

async function seedPublicContent() {
  try {
    await connectDatabase();

    await VenueInfo.findOneAndUpdate(
      {},
      { $set: venue },
      { upsert: true, new: true }
    );

    for (const service of services) {
      await Service.updateOne(
        { key: service.key },
        { $set: service },
        { upsert: true }
      );
    }

    for (const faq of faqs) {
  await Faq.collection.updateOne(
    { key: faq.key },
    { $set: faq },
    { upsert: true }
  );
}

    console.log("Public content seed completed successfully.");
  } catch (error) {
    console.error("Public content seed error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedPublicContent();