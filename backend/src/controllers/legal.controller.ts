import type { Request, Response } from "express";
import {
  LEGAL_DOCUMENT_KEYS,
  LegalDocument,
  type LegalDocumentKey,
} from "../models/LegalDocument";

const defaults: Record<
  LegalDocumentKey,
  { fr: string; ar: string; en: string }
> = {
  "mentions-legales": {
    fr: "Mentions légales",
    ar: "الإشعارات القانونية",
    en: "Legal notice",
  },
  cgv: {
    fr: "Conditions générales de vente",
    ar: "الشروط العامة للبيع",
    en: "Terms and conditions",
  },
  confidentialite: {
    fr: "Politique de confidentialité",
    ar: "سياسة الخصوصية",
    en: "Privacy policy",
  },
  cookies: {
    fr: "Politique des cookies",
    ar: "سياسة ملفات تعريف الارتباط",
    en: "Cookie policy",
  },
  annulation: {
    fr: "Politique d’annulation",
    ar: "سياسة الإلغاء",
    en: "Cancellation policy",
  },
};

export async function ensureLegalDocuments() {
  await Promise.all(
    LEGAL_DOCUMENT_KEYS.map((key) =>
      LegalDocument.updateOne(
        { key },
        {
          $setOnInsert: {
            key,
            title: defaults[key],
            content: { fr: "", ar: "", en: "" },
            published: false,
          },
        },
        { upsert: true }
      )
    )
  );
}

export async function getPublicLegalDocument(
  req: Request,
  res: Response
) {
  try {
    const key = String(req.params.key || "");

    if (
      !LEGAL_DOCUMENT_KEYS.includes(
        key as (typeof LEGAL_DOCUMENT_KEYS)[number]
      )
    ) {
      return res.status(404).json({
        success: false,
        message: "Legal document not found",
      });
    }

     const legalDocumentModel: any = LegalDocument;

const document = await legalDocumentModel.findOne({
  key,
  published: true,
}).lean();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Legal document is not published",
      });
    }

    return res.json({
      success: true,
      document: {
        key: document.key,
        title: document.title,
        content: document.content,
        updatedAt: document.updatedAt,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load legal document",
    });
  }
}