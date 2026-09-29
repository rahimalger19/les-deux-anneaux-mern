import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import type { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { Invoice } from "../models/Invoice";
import { createProFormaForBooking } from "../services/proforma.service";
import mongoose from "mongoose";
import { ProForma } from "../models/ProForma";
import {
  hashProFormaDownloadToken,
} from "../services/proforma.service";

const proFormaStatuses = new Set([
  "HELD",
  "PROOF_PENDING",
  "PAID",
  "INVOICED",
  "DONE",
]);

function getToken(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isPublicProFormaToken(value: string | undefined) {
  return Boolean(value && /^[a-f0-9]{64}$/i.test(value));
}

function formatDZD(amount: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function sendPdf(
  res: Response,
  data: {
    title: string;
    documentNumber: string;
    booking: any;
    totalDZD: number;
    depositDZD: number;
  }
) {
  const pdf = new PDFDocument({
    size: "A4",
    margin: 54,
  });

  const filename = `${data.documentNumber}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${filename}"`
  );

  pdf.pipe(res);

  pdf.rect(0, 0, 595, 110).fill("#0A0A0B");

  const logoPath = path.resolve(
    process.cwd(),
    "assets",
    "logo-white-mode.jpg"
  );

  if (fs.existsSync(logoPath)) {
    pdf.image(logoPath, 54, 25, { fit: [170, 60] });
  } else {
    pdf.fillColor("#C6A15B").fontSize(22).text("Les Deux Anneaux", 54, 45);
  }

  pdf.fillColor("#0A0A0B");
  pdf.fontSize(25).text(data.title, 54, 145);

  pdf
    .fontSize(12)
    .fillColor("#555555")
    .text(`Numéro : ${data.documentNumber}`, 54, 185)
    .text(`Émis le : ${new Date().toLocaleDateString("fr-DZ")}`, 54, 205);

  pdf
    .moveTo(54, 235)
    .lineTo(541, 235)
    .strokeColor("#C6A15B")
    .stroke();

  pdf.fillColor("#0A0A0B").fontSize(14).text("Détails de réservation", 54, 260);

  pdf
    .fontSize(11)
    .text(`Date : ${data.booking.eventDate}`, 54, 295)
    .text(`Créneau : ${data.booking.slot}`, 54, 315)
    .text(`Événement : ${data.booking.eventTypeKey}`, 54, 335)
    .text(`Pack : ${data.booking.packKey}`, 54, 355)
    .text(
      `Invités : ${data.booking.womenGuests} femmes, ${data.booking.menGuests} hommes`,
      54,
      375
    );

  pdf
    .moveTo(54, 410)
    .lineTo(541, 410)
    .strokeColor("#DDDDDD")
    .stroke();

  pdf.fillColor("#0A0A0B").fontSize(14).text("Montants", 54, 435);

  pdf
    .fontSize(12)
    .text(`Total : ${formatDZD(data.totalDZD)}`, 54, 470)
    .fillColor("#A67C32")
    .fontSize(16)
    .text(`Acompte : ${formatDZD(data.depositDZD)}`, 54, 500);

  pdf
    .fillColor("#555555")
    .fontSize(9)
    .text(
      "Les Deux Anneaux - Document généré automatiquement.",
      54,
      760,
      { align: "center", width: 487 }
    );

  pdf.end();
}

export async function downloadGuestProForma(
  req: Request,
  res: Response
) {
  try {
    const token = getToken(req.params.token);

    const booking = await Booking.findOne({ guestToken: token });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
   if (!proFormaStatuses.has(booking.status)) {
  return res.status(404).json({
    success: false,
    message: "Pro forma is not available yet",
  });
}
    const proForma = await ProForma.findOne({
  bookingId: booking._id,
});

if (!proForma) {
  return res.status(404).json({
    success: false,
    message: "Pro forma has not been issued yet",
  });
}

    sendPdf(res, {
      title: "Pro Forma",
      documentNumber: proForma.proFormaNumber,
      booking,
      totalDZD: proForma.totalDZD,
      depositDZD: proForma.depositDZD,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to generate pro forma",
    });
  }
}

export async function downloadGuestInvoice(
  req: Request,
  res: Response
) {
  try {
    const token = getToken(req.params.token);

    const booking = await Booking.findOne({ guestToken: token });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const invoice = await Invoice.findOne({ bookingId: booking._id });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice is not available yet",
      });
    }

    sendPdf(res, {
      title: "Facture",
      documentNumber: invoice.invoiceNumber,
      booking,
      totalDZD: booking.totalDZD,
      depositDZD: invoice.amountDZD,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to generate invoice",
    });
  }
}

export async function getMyDocuments(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const bookings = await Booking.find({
      userId: req.user.id,
      status: {
        $in: ["HELD", "PROOF_PENDING", "PAID", "INVOICED", "DONE"],
      },
    }).sort({ createdAt: -1 });

  const bookingIds = bookings.map((booking) => booking._id);

const [proFormas, invoices] = await Promise.all([
  ProForma.find({
    bookingId: { $in: bookingIds },
  }).lean(),

  Invoice.find({
    bookingId: { $in: bookingIds },
  }).lean(),
]);

const proFormasByBookingId = new Map(
  proFormas.map((proForma) => [
    proForma.bookingId.toString(),
    proForma,
  ])
);

const invoicesByBookingId = new Map(
  invoices.map((invoice) => [
    invoice.bookingId.toString(),
    invoice,
  ])
);

const documents = bookings.map((booking) => {
  const proForma = proFormasByBookingId.get(
    booking._id.toString()
  );
  const invoice = invoicesByBookingId.get(
    booking._id.toString()
  );

  return {
    bookingId: booking._id,
    eventDate: booking.eventDate,
    eventTypeKey: booking.eventTypeKey,
    status: booking.status,
    proFormaNumber: proForma?.proFormaNumber || null,
    invoiceNumber: invoice?.invoiceNumber || null,
  };
});

return res.json({ success: true, documents });

    return res.json({ success: true, documents });
  } catch (error) {
    console.error("Get my documents error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load documents",
    });
  }
}

export async function downloadMyProForma(req: Request, res: Response) {
  try {
    const bookingId = getToken(req.params.bookingId);

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user?.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
    if (!proFormaStatuses.has(booking.status)) {
  return res.status(404).json({
    success: false,
    message: "Pro forma is not available yet",
  });
}
     const proForma = await ProForma.findOne({
  bookingId: booking._id,
});

if (!proForma) {
  return res.status(404).json({
    success: false,
    message: "Pro forma has not been issued yet",
  });
}

    sendPdf(res, {
      title: "Pro Forma",
      documentNumber: proForma.proFormaNumber,
      booking,
      totalDZD: proForma.totalDZD,
      depositDZD: proForma.depositDZD,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to generate pro forma",
    });
  }
}

export async function downloadMyInvoice(req: Request, res: Response) {
  try {
    const bookingId = getToken(req.params.bookingId);

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user?.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const invoice = await Invoice.findOne({
      bookingId: booking._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice is not available yet",
      });
    }

    sendPdf(res, {
      title: "Facture",
      documentNumber: invoice.invoiceNumber,
      booking,
      totalDZD: booking.totalDZD,
      depositDZD: invoice.amountDZD,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to generate invoice",
    });
  }
}

export async function downloadPublicProForma(
  req: Request,
  res: Response
) {
  try {
    const token = getToken(req.params.token);

    if (!isPublicProFormaToken(token)) {
      return res.status(404).json({
        success: false,
        message: "Pro forma not found",
      });
    }

   if (!token) {
  return res.status(400).json({
    success: false,
    message: "Download token is required",
  });
}

    const proForma = await ProForma.findOne({
      downloadTokenHash: hashProFormaDownloadToken(token),
      downloadTokenExpiresAt: { $gt: new Date() },
    });

    if (!proForma) {
      return res.status(404).json({
        success: false,
        message: "This pro forma link is invalid or has expired",
      });
    }

    const booking = await Booking.findById(proForma.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return sendPdf(res, {
      title: "Pro Forma",
      documentNumber: proForma.proFormaNumber,
      booking,
      totalDZD: proForma.totalDZD,
      depositDZD: proForma.depositDZD,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to generate pro forma",
    });
  }
}