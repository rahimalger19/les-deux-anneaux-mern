import type { Request, Response } from "express";
import { Appointment } from "../models/Appointment";
import {
  CONTACT_APPOINTMENT_SLOTS,
  CONTACT_APPOINTMENT_TYPES,
  CONTACT_REQUEST_TYPES,
  ContactMessage,
} from "../models/ContactMessage";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function createContactMessage(req: Request, res: Response) {
  try {
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const subject = String(req.body.subject || "").trim();
    const message = String(req.body.message || "").trim();
    const language = String(req.body.language || "");
    const callbackSlot = String(req.body.callbackSlot || "").trim();

    const requestType = String(req.body.requestType || "GENERAL");
    const requestedAppointmentType = String(
      req.body.requestedAppointmentType || ""
    );
    const requestedAppointmentSlot = String(
      req.body.requestedAppointmentSlot || ""
    );

    if (
      !name ||
      !phone ||
      !isEmail(email) ||
      !subject ||
      !message ||
      !["fr-DZ", "ar-DZ", "en"].includes(language) ||
      !callbackSlot ||
      !CONTACT_REQUEST_TYPES.includes(
        requestType as (typeof CONTACT_REQUEST_TYPES)[number]
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être renseignés.",
      });
    }

    const isAppointmentRequest = requestType === "APPOINTMENT";

    if (
      isAppointmentRequest &&
      (!CONTACT_APPOINTMENT_TYPES.includes(
        requestedAppointmentType as (typeof CONTACT_APPOINTMENT_TYPES)[number]
      ) ||
        !CONTACT_APPOINTMENT_SLOTS.includes(
          requestedAppointmentSlot as (typeof CONTACT_APPOINTMENT_SLOTS)[number]
        ))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le type de rendez-vous et le créneau souhaité sont obligatoires.",
      });
    }

    if (!isAppointmentRequest) {
      const allowedCallbackSlots = [
        "DAY",
        "AFTERNOON",
        "EVENING",
        "NIGHT",
      ];

      if (!allowedCallbackSlots.includes(callbackSlot)) {
        return res.status(400).json({
          success: false,
          message: "Invalid callback slot.",
        });
      }
    }

    type ContactLanguage = "fr-DZ" | "ar-DZ" | "en";
    type ContactRequestType = "GENERAL" | "APPOINTMENT";
    type AppointmentRequestType = "VISIT" | "VIDEO";
    type AppointmentRequestSlot = "DAY" | "EVENING" | "NIGHT";

    const safeLanguage = language as ContactLanguage;
    const safeRequestType = requestType as ContactRequestType;

    const safeAppointmentType = isAppointmentRequest
      ? (requestedAppointmentType as AppointmentRequestType)
      : undefined;

    const safeAppointmentSlot = isAppointmentRequest
      ? (requestedAppointmentSlot as AppointmentRequestSlot)
      : undefined;

    const contactMessage = await ContactMessage.create({
      name,
      phone,
      email,
      subject,
      message,
      language: safeLanguage,
      callbackSlot,
      source: "PUBLIC_CONTACT",
      requestType: safeRequestType,
      requestedAppointmentType: safeAppointmentType,
      requestedAppointmentSlot: safeAppointmentSlot,
    });

    let appointmentId: string | undefined;

    if (isAppointmentRequest) {
      const appointment = await Appointment.create({
        contactMessageId: contactMessage._id,
        guestName: name,
        guestEmail: email,
        guestPhone: phone,
        source: "CONTACT",
        type: safeAppointmentType as AppointmentRequestType,
        requestedSlot: safeAppointmentSlot as AppointmentRequestSlot,
        timezone: "Africa/Algiers",
        notes: message,
        status: "PENDING",
      });

      appointmentId = appointment._id.toString();
    }

    return res.status(201).json({
      success: true,
      message: isAppointmentRequest
        ? "Votre demande de rendez-vous a été envoyée."
        : "Votre message a été envoyé avec succès.",
      contactMessage,
      appointmentId,
    });
  } catch (error) {
    console.error("Create contact message error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}