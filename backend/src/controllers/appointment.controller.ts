import type { Request, Response } from "express";
import {
  Appointment,
  APPOINTMENT_TYPES,
} from "../models/Appointment";

export async function createAppointment(req: Request, res: Response) {
  try {
    const { type, scheduledAt, notes } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!APPOINTMENT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment type",
      });
    }

    const date = new Date(scheduledAt);

    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid future appointment date",
      });
    }

    const appointment = await Appointment.create({
      userId: req.user.id,
      type,
      scheduledAt: date,
      timezone: "Africa/Algiers",
      notes: String(notes || "").trim() || undefined,
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Appointment request sent",
      appointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create appointment",
    });
  }
}

export async function getMyAppointments(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const appointments = await Appointment.find({
      userId: req.user.id,
    })
      .sort({ scheduledAt: 1 })
      .lean();

    return res.json({
      success: true,
      appointments: appointments.map((appointment) => ({
        id: appointment._id,
        ...appointment,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load appointments",
    });
  }
}

export async function cancelMyAppointment(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const appointment = await Appointment.findOne({
      _id: id,
      userId: req.user?.id,
      status: { $in: ["PENDING", "CONFIRMED"] },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.status = "CANCELLED";
    await appointment.save();

    return res.json({
      success: true,
      message: "Appointment cancelled",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to cancel appointment",
    });
  }
}