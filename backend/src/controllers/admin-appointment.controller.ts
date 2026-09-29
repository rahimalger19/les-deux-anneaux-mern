import mongoose from "mongoose";
import type { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";
import {
  Appointment,
  APPOINTMENT_SLOTS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_SOURCES,
  type AppointmentSlot,
} from "../models/Appointment";
import { ContactMessage } from "../models/ContactMessage";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isValidDate(value: string) {
  const parsed = new Date(`${value}T12:00:00.000Z`);

  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function getDateRange(date: string) {
  const start = new Date(`${date}T00:00:00.000+01:00`);
  const end = new Date(start);

  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

function getAlgeriaAppointmentSlot(date: Date): AppointmentSlot {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Algiers",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date)
  );

  if (hour >= 18) {
    return "EVENING";
  }

  if (hour < 8) {
    return "NIGHT";
  }

  return "DAY";
}

export async function getAdminAppointments(
  req: Request,
  res: Response
) {
  try {
    const status = String(req.query.status || "");
    const date = String(req.query.date || "");
    const source = String(req.query.source || "");

    if (
      status &&
      !APPOINTMENT_STATUSES.includes(
        status as (typeof APPOINTMENT_STATUSES)[number]
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment status",
      });
    }

    if (
      source &&
      !APPOINTMENT_SOURCES.includes(
        source as (typeof APPOINTMENT_SOURCES)[number]
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment source",
      });
    }

    if (date && !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Date must use YYYY-MM-DD format",
      });
    }

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (source) {
      filter.source = source;
    }

    if (date) {
      const { start, end } = getDateRange(date);
      filter.scheduledAt = { $gte: start, $lt: end };
    }

    const appointments = await Appointment.find(filter)
      .populate("userId", "name email phone")
      .sort({ scheduledAt: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      appointments: (appointments as any[]).map((appointment) => ({
        id: appointment._id.toString(),
        source: appointment.source,
        type: appointment.type,
        requestedSlot: appointment.requestedSlot,
        appointmentSlot: appointment.appointmentSlot,
        scheduledAt: appointment.scheduledAt,
        timezone: appointment.timezone,
        notes: appointment.notes,
        status: appointment.status,
        client: appointment.userId
          ? {
              id: appointment.userId._id.toString(),
              name: appointment.userId.name,
              email: appointment.userId.email,
              phone: appointment.userId.phone,
            }
          : {
              name: appointment.guestName || "Client invité",
              email: appointment.guestEmail || "",
              phone: appointment.guestPhone,
            },
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load appointments",
    });
  }
}

export async function updateAdminAppointment(
  req: Request,
  res: Response
) {
  try {
    const appointmentId = getParam(req.params.appointmentId);
    const action = String(req.body.action || "");

    if (
      !appointmentId ||
      !mongoose.isValidObjectId(appointmentId) ||
      !["CONFIRM", "CANCEL"].includes(action)
    ) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID and valid action are required",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (action === "CONFIRM") {
      const scheduledAt = new Date(String(req.body.scheduledAt || ""));
      const appointmentSlot = String(req.body.appointmentSlot || "");

      if (
        Number.isNaN(scheduledAt.getTime()) ||
        scheduledAt.getTime() <= Date.now() ||
        !APPOINTMENT_SLOTS.includes(
          appointmentSlot as (typeof APPOINTMENT_SLOTS)[number]
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A future date/time and a valid day, evening or night slot are required",
        });
      }

      if (appointment.status !== "PENDING") {
        return res.status(409).json({
          success: false,
          message: "Only pending appointments can be confirmed",
        });
      }

      if (getAlgeriaAppointmentSlot(scheduledAt) !== appointmentSlot) {
        return res.status(400).json({
          success: false,
          message:
            "The selected date/time does not match the selected appointment slot",
        });
      }

      appointment.scheduledAt = scheduledAt;
      appointment.appointmentSlot = appointmentSlot as AppointmentSlot;
      appointment.status = "CONFIRMED";

      if (appointment.contactMessageId) {
        await ContactMessage.findByIdAndUpdate(
          appointment.contactMessageId,
          {
            $set: {
              status: "RESOLVED",
              assignedTo: req.user?.id,
            },
          }
        );
      }

      await appointment.save();

      await AuditLog.create({
        actorId: req.user?.id,
        action: "APPOINTMENT_CONFIRMED",
        entityType: "Appointment",
        entityId: appointment._id.toString(),
        metadata: {
          source: appointment.source,
          type: appointment.type,
          appointmentSlot,
          scheduledAt,
        },
      });

      return res.json({
        success: true,
        message: "Appointment confirmed",
      });
    }

    if (appointment.status === "CANCELLED") {
      return res.status(409).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    appointment.status = "CANCELLED";
    await appointment.save();

    await AuditLog.create({
      actorId: req.user?.id,
      action: "APPOINTMENT_CANCELLED",
      entityType: "Appointment",
      entityId: appointment._id.toString(),
      metadata: {
        source: appointment.source,
        type: appointment.type,
      },
    });

    return res.json({
      success: true,
      message: "Appointment cancelled",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update appointment",
    });
  }
}