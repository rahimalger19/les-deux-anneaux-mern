import path from "path";
import type { Request, Response } from "express";
import {
  PAYMENT_METHODS,
  Payment,
  type PaymentMethod,
} from "../models/Payment";
import { Booking } from "../models/Booking";
import { createPaymentForBooking } from "../services/payment.service";
import { AuditLog } from "../models/AuditLog";
import { createInvoiceForBooking } from "../services/invoice.service";
import { LocalPayer } from "../models/LocalPayer";
import { PaymentConfiguration } from "../models/PaymentConfiguration";
import { paymentProofDirectory } from "../middleware/upload.middleware";

export async function createPayment(req: Request, res: Response) {
  try {
    const rawToken = req.params.token;
const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

const { method } = req.body;

if (!token || !method) {
      return res.status(400).json({
        success: false,
        message: "bookingId and payment method are required",
      });
    }

    if (!PAYMENT_METHODS.includes(method as PaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }
    const booking = await Booking.findOne({ guestToken: token });

if (!booking) {
  return res.status(404).json({
    success: false,
    message: "Booking not found",
  });
}
    const payment = await createPaymentForBooking(
  booking._id.toString(),
  method as PaymentMethod
);

    return res.status(201).json({
      success: true,
      payment: {
        id: payment._id,
        bookingId: payment.bookingId,
        method: payment.method,
        amountDZD: payment.amountDZD,
        status: payment.status,
      },
    });
  } catch (error: any) {
    console.error("Create payment error:", error);

    return res.status(400).json({
      success: false,
      message: error?.message || "Unable to create payment",
    });
  }
}

export async function getBookingPayment(req: Request, res: Response) {
  try {
    const rawBookingId = req.params.bookingId;
    const bookingId = Array.isArray(rawBookingId)
      ? rawBookingId[0]
      : rawBookingId;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const payment = await Payment.findOne({
      bookingId: booking._id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load payment",
    });
  }
}

export async function getPaymentInstructions(
  _req: Request,
  res: Response
) {
  try {
    const paymentConfigurationModel: any = PaymentConfiguration;

    const configuration = await paymentConfigurationModel
      .findOne({ key: "default" })
      .lean();

    const legacyCcpDetails =
      process.env.CCP_PAYMENT_INSTRUCTIONS?.trim() || "";

    const legacyBaridiMobDetails =
      process.env.BARIDIMOB_PAYMENT_INSTRUCTIONS?.trim() || "";

    const ccpDetails = [
      configuration?.ccpRip
        ? `RIP CCP : ${configuration.ccpRip}`
        : "",
      configuration?.ccp?.details || legacyCcpDetails,
    ]
      .filter(Boolean)
      .join("\n");

    const baridiMobDetails =
      configuration?.baridiMob?.details || legacyBaridiMobDetails;

    return res.json({
      success: true,
      instructions: {
        CCP: {
          enabled: configuration
            ? Boolean(configuration.ccp?.enabled)
            : Boolean(ccpDetails),
          label: configuration?.ccp?.label || "CCP",
          details: ccpDetails || null,
        },
        BARIDIMOB: {
          enabled: configuration
            ? Boolean(configuration.baridiMob?.enabled)
            : Boolean(baridiMobDetails),
          label: configuration?.baridiMob?.label || "BaridiMob",
          details: baridiMobDetails || null,
        },
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load payment instructions",
    });
  }
}

export async function uploadPaymentProof(
  req: Request,
  res: Response
) {
  try {
    const rawBookingId = req.params.bookingId;

    const bookingId = Array.isArray(rawBookingId)
      ? rawBookingId[0]
      : rawBookingId;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Proof file is required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      booking.status !== "PROOF_PENDING" &&
      booking.status !== "HELD"
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking is not ready for proof upload",
      });
    }

    if (
      !booking.holdExpiresAt ||
      booking.holdExpiresAt.getTime() <= Date.now()
    ) {
      booking.status = "EXPIRED";
      booking.activeSlotKey = undefined;
      booking.holdExpiresAt = undefined;
      await booking.save();

      return res.status(400).json({
        success: false,
        message: "Booking hold has expired",
      });
    }

    const payment = await Payment.findOne({
      bookingId: booking._id,
      status: "PENDING",
    }).select("+proofStorageKey");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pending payment not found",
      });
    }

    payment.proofFileName = req.file.originalname;
    payment.proofMimeType = req.file.mimetype;
    payment.proofStorageKey = req.file.filename;
    payment.proofUrl = undefined;

    await payment.save();

    booking.status = "PROOF_PENDING";
    await booking.save();

    return res.json({
      success: true,
      message: "Payment proof uploaded",
      payment: {
        id: payment._id,
        status: payment.status,
        proofFileName: payment.proofFileName,
      },
    });
  } catch (error: any) {
    console.error("Upload payment proof error:", error);

    return res.status(400).json({
      success: false,
      message:
        error?.message ||
        "Unable to upload payment proof",
    });
  }
}

export async function listPendingProofPayments(
  _req: Request,
  res: Response
) {
  try {
    const payments = await Payment.find({
      status: "PENDING",
      proofStorageKey: { $exists: true, $ne: "" },
    })
      .populate(
        "bookingId",
        "eventDate slot eventTypeKey guestPhone depositDZD status"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      payments: (payments as any[]).map((payment) => ({
        id: payment._id.toString(),
        method: payment.method,
        amountDZD: payment.amountDZD,
        reference: payment.reference,
        proofFileName: payment.proofFileName,
        proofMimeType: payment.proofMimeType,
        createdAt: payment.createdAt,
        booking: payment.bookingId
          ? {
              id: payment.bookingId._id.toString(),
              eventDate: payment.bookingId.eventDate,
              slot: payment.bookingId.slot,
              eventTypeKey: payment.bookingId.eventTypeKey,
              guestPhone: payment.bookingId.guestPhone,
              depositDZD: payment.bookingId.depositDZD,
              status: payment.bookingId.status,
            }
          : null,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load pending payments",
    });
  }
}

export async function validatePayment(req: Request, res: Response) {
  try {
    const rawPaymentId = req.params.paymentId;
    const paymentId = Array.isArray(rawPaymentId)
      ? rawPaymentId[0]
      : rawPaymentId;

    const reference = String(req.body.reference || "").trim().toUpperCase();

    if (
      !paymentId ||
      reference.length < 3 ||
      reference.length > 120
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid payment reference is required",
      });
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      status: "PENDING",
      proofStorageKey: { $exists: true, $ne: "" },
    }).select("+proofStorageKey");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pending payment proof not found",
      });
    }

    const booking = await Booking.findById(payment.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "PROOF_PENDING") {
      return res.status(409).json({
        success: false,
        message: "Booking is not awaiting proof verification",
      });
    }

    if (payment.amountDZD !== booking.depositDZD) {
      return res.status(409).json({
        success: false,
        message: "Payment amount does not match the required deposit",
      });
    }

    payment.status = "VERIFIED";
    payment.reference = reference;
    payment.validatedBy = req.user?.id as any;
    payment.validatedAt = new Date();
    await payment.save();

    booking.status = "PAID";
    await booking.save();

    const invoice = await createInvoiceForBooking(
      booking._id.toString()
    );

    booking.status = "INVOICED";
    await booking.save();

    await AuditLog.create({
      actorId: req.user?.id,
      action: "PAYMENT_VALIDATED",
      entityType: "Payment",
      entityId: payment._id.toString(),
      metadata: {
        bookingId: booking._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        reference: payment.reference,
      },
    });

    return res.json({
      success: true,
      message: "Payment validated and invoice issued",
      payment,
      invoice,
    });
  } catch (error) {
    console.error("Validate payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to validate payment",
    });
  }
}

export async function rejectPayment(req: Request, res: Response) {
  try {
    const rawPaymentId = req.params.paymentId;
    const paymentId = Array.isArray(rawPaymentId)
      ? rawPaymentId[0]
      : rawPaymentId;

    const rejectionReason = String(req.body.rejectionReason || "").trim();

    if (!paymentId || !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Payment ID and rejection reason are required",
      });
    }

    const payment = await Payment.findOne({
  _id: paymentId,
  status: "PENDING",
  proofStorageKey: { $exists: true, $ne: "" },
}).select("+proofStorageKey");

    if (!payment || payment.status !== "PENDING" || !payment.proofStorageKey) {
      return res.status(404).json({
        success: false,
        message: "Pending payment proof not found",
      });
    }

    const booking = await Booking.findById(payment.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    payment.status = "REJECTED";
    payment.rejectionReason = rejectionReason;
    payment.validatedBy = req.user?.id as any;
    payment.validatedAt = new Date();
    await payment.save();

    const holdIsStillActive =
      booking.holdExpiresAt &&
      booking.holdExpiresAt.getTime() > Date.now();

    if (holdIsStillActive) {
      booking.status = "HELD";
    } else {
      booking.status = "EXPIRED";
      booking.activeSlotKey = undefined;
      booking.holdExpiresAt = undefined;
    }

    await booking.save();

    await AuditLog.create({
      actorId: req.user?.id,
      action: "PAYMENT_REJECTED",
      entityType: "Payment",
      entityId: payment._id.toString(),
      metadata: {
        bookingId: booking._id.toString(),
        rejectionReason,
      },
    });

    return res.json({
      success: true,
      message: "Payment proof rejected",
      payment,
    });
  } catch (error) {
    console.error("Reject payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject payment",
    });
  }
}

export async function getMyPayments(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const payments = await Payment.find()
      .populate({
        path: "bookingId",
        match: { userId: req.user.id },
        select: "eventDate eventTypeKey slot status depositDZD",
      })
      .populate("localPayerId", "name phone relationship paymentMethod")
      .sort({ createdAt: -1 });

    const ownedPayments = payments.filter(
      (payment) =>
        payment.bookingId &&
        typeof payment.bookingId === "object" &&
        "_id" in payment.bookingId
    );

    return res.json({
      success: true,
      payments: ownedPayments,
    });
  } catch (error) {
    console.error("Get my payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load payments",
    });
  }
}

export async function createMyPayment(req: Request, res: Response) {
  try {
    const rawBookingId = req.params.bookingId;
    const bookingId = Array.isArray(rawBookingId)
      ? rawBookingId[0]
      : rawBookingId;

    const method = String(req.body.method || "").trim();
    const reference = String(req.body.reference || "").trim();
    const localPayerId = String(req.body.localPayerId || "").trim();

    if (!req.user || !bookingId || !method || !reference) {
      return res.status(400).json({
        success: false,
        message: "Payment method and payment reference are required",
      });
    }

    if (!["CCP", "BARIDIMOB", "VIREMENT"].includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    let localPayer = null;

    if (localPayerId) {
      localPayer = await LocalPayer.findOne({
        _id: localPayerId,
        clientUserId: req.user.id,
        bookingId: booking._id,
        active: true,
      });

      if (!localPayer) {
        return res.status(403).json({
          success: false,
          message: "Local payer is not valid for this booking",
        });
      }

      if (localPayer.paymentMethod !== method) {
        return res.status(400).json({
          success: false,
          message: "Payment method differs from the delegated payer method",
        });
      }
    }

    if (booking.status !== "HELD") {
      return res.status(400).json({
        success: false,
        message: "This booking is not ready for the deposit payment",
      });
    }

    const existingPendingPayment = await Payment.findOne({
      bookingId: booking._id,
      status: "PENDING",
    });

    if (existingPendingPayment) {
      return res.status(409).json({
        success: false,
        message: "A payment is already awaiting proof or verification",
      });
    }

    const payment = await createPaymentForBooking(
      booking._id.toString(),
      method as PaymentMethod
    );

    payment.reference = reference;
    payment.localPayerId = localPayer?._id;
    await payment.save();

    return res.status(201).json({
      success: true,
      payment,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create payment",
    });
  }
}

export async function uploadMyPaymentProof(
  req: Request,
  res: Response
) {
  try {
    const rawBookingId = req.params.bookingId;
    const bookingId = Array.isArray(rawBookingId)
      ? rawBookingId[0]
      : rawBookingId;

    if (!req.user || !bookingId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Proof file is required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      booking.status !== "HELD" &&
      booking.status !== "PROOF_PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking is not ready for proof upload",
      });
    }

    if (
      !booking.holdExpiresAt ||
      booking.holdExpiresAt.getTime() <= Date.now()
    ) {
      booking.status = "EXPIRED";
      booking.activeSlotKey = undefined;
      booking.holdExpiresAt = undefined;
      await booking.save();

      return res.status(400).json({
        success: false,
        message: "Booking hold has expired",
      });
    }

    const payment = await Payment.findOne({
      bookingId: booking._id,
      status: "PENDING",
    }).select("+proofStorageKey");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pending payment not found",
      });
    }

    payment.proofFileName = req.file.originalname;
    payment.proofMimeType = req.file.mimetype;
    payment.proofStorageKey = req.file.filename;
    payment.proofUrl = undefined;

    await payment.save();

    booking.status = "PROOF_PENDING";
    await booking.save();

    return res.json({
      success: true,
      message: "Payment proof uploaded successfully",
      payment: {
        id: payment._id,
        status: payment.status,
        proofFileName: payment.proofFileName,
      },
    });
  } catch (error) {
    console.error("Upload account payment proof error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to upload payment proof",
    });
  }
}

export async function downloadAdminPaymentProof(
  req: Request,
  res: Response
) {
  try {
    const rawPaymentId = req.params.paymentId;
    const paymentId = Array.isArray(rawPaymentId)
      ? rawPaymentId[0]
      : rawPaymentId;

    const payment = await Payment.findById(paymentId).select(
      "+proofStorageKey proofFileName proofMimeType"
    );

    if (!payment?.proofStorageKey) {
      return res.status(404).json({
        success: false,
        message: "Payment proof not found",
      });
    }

    const filePath = path.resolve(
      paymentProofDirectory,
      path.basename(payment.proofStorageKey)
    );

    if (path.dirname(filePath) !== paymentProofDirectory) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment proof path",
      });
    }

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${payment.proofFileName || "payment-proof"}"`
    );

    if (payment.proofMimeType) {
      res.type(payment.proofMimeType);
    }

    return res.sendFile(filePath);
  } catch {
    return res.status(404).json({
      success: false,
      message: "Payment proof not found",
    });
  }
}