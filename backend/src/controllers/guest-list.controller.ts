import type { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { EventType } from "../models/EventType";
import { GuestList, type IGuestListEntry } from "../models/GuestList";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/^\uFEFF/, "");
}

function normalizeGender(value: string): "WOMAN" | "MAN" | null {
  const normalized = value.trim().toUpperCase();

  if (["F", "FEMME", "FEMALE", "WOMAN", "WOMEN"].includes(normalized)) {
    return "WOMAN";
  }

  if (["M", "HOMME", "MALE", "MAN", "MEN"].includes(normalized)) {
    return "MAN";
  }

  return null;
}

function parseCsv(buffer: Buffer): IGuestListEntry[] {
  const content = buffer.toString("utf8").trim();

  if (!content) {
    throw new Error("The CSV file is empty");
  }

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const separator = lines[0].includes(";") ? ";" : ",";

  const headers = lines[0]
    .split(separator)
    .map(normalizeHeader);

  const nameIndex = headers.findIndex((header) =>
    ["name", "nom"].includes(header)
  );

  const genderIndex = headers.findIndex((header) =>
    ["gender", "sexe"].includes(header)
  );

  if (nameIndex === -1 || genderIndex === -1) {
    throw new Error(
      "CSV headers must contain name or nom, and gender or sexe"
    );
  }

  const entries: IGuestListEntry[] = [];

  lines.slice(1).forEach((line, index) => {
    const columns = line.split(separator).map((value) => value.trim());
    const name = columns[nameIndex];
    const gender = normalizeGender(columns[genderIndex] || "");

    if (!name || !gender) {
      throw new Error(`Invalid guest at CSV line ${index + 2}`);
    }

    entries.push({ name, gender });
  });

  if (entries.length === 0) {
    throw new Error("The CSV file contains no guests");
  }

  return entries;
}

async function getOwnedBookingWithCapacity(
  userId: string,
  bookingId: string
) {
  const booking = await Booking.findOne({
    _id: bookingId,
    userId,
  }).lean();

  if (!booking) {
    throw new Error("Booking not found");
  }

  const eventType = await EventType.findOne({
    key: booking.eventTypeKey,
    active: true,
  })
    .select("womenCapacity menCapacity")
    .lean();

  if (!eventType) {
    throw new Error("Event type not found");
  }

  return { booking, eventType };
}

export async function getMyGuestList(req: Request, res: Response) {
  try {
    const bookingId = getParam(req.params.bookingId);

    if (!req.user || !bookingId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { booking, eventType } = await getOwnedBookingWithCapacity(
      req.user.id,
      bookingId
    );

    const guestList = await GuestList.findOne({
      userId: req.user.id,
      bookingId,
    }).lean();

    return res.json({
      success: true,
      booking: {
        id: booking._id,
        eventDate: booking.eventDate,
        eventTypeKey: booking.eventTypeKey,
      },
      capacity: {
        women: eventType.womenCapacity,
        men: eventType.menCapacity,
      },
      guestList,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load guest list",
    });
  }
}

export async function importMyGuestList(req: Request, res: Response) {
  try {
    const bookingId = getParam(req.params.bookingId);

    if (!req.user || !bookingId || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Booking and CSV file are required",
      });
    }

    const { eventType } = await getOwnedBookingWithCapacity(
      req.user.id,
      bookingId
    );

    const entries = parseCsv(req.file.buffer);

    const womenCount = entries.filter(
      (entry) => entry.gender === "WOMAN"
    ).length;

    const menCount = entries.filter(
      (entry) => entry.gender === "MAN"
    ).length;

    if (womenCount > eventType.womenCapacity) {
      return res.status(400).json({
        success: false,
        message: "Women guest count exceeds venue capacity",
      });
    }

    if (menCount > eventType.menCapacity) {
      return res.status(400).json({
        success: false,
        message: "Men guest count exceeds venue capacity",
      });
    }

    const guestList = await GuestList.findOneAndUpdate(
      {
        userId: req.user.id,
        bookingId,
      },
      {
        $set: {
          entries,
          womenCount,
          menCount,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    return res.json({
      success: true,
      message: "Guest list imported",
      guestList,
      capacity: {
        women: eventType.womenCapacity,
        men: eventType.menCapacity,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to import guest list",
    });
  }
}