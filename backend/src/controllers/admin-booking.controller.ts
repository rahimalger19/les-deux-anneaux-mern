import mongoose from "mongoose";
import type { Request, Response } from "express";
import {
  Booking,
  BOOKING_STATUSES,
  type BookingStatus,
} from "../models/Booking";
import { EventType } from "../models/EventType";
import { User } from "../models/User";

const currencies = ["DZD", "EUR", "USD"] as const;
const sources = ["ONLINE", "WALK_IN"] as const;

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getPositiveInteger(value: unknown, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getAdminBookings(req: Request, res: Response) {
  try {
    const source = getString(req.query.source);
    const eventTypeKey = getString(req.query.eventTypeKey);
    const currency = getString(req.query.currency);
    const agent = getString(req.query.agent);
    const status = getString(req.query.status);
    const search = getString(req.query.search).slice(0, 100);
    const page = getPositiveInteger(req.query.page, 1, 10_000);
    const limit = getPositiveInteger(req.query.limit, 25, 100);

    if (source && !sources.includes(source as (typeof sources)[number])) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking source",
      });
    }

    if (
      currency &&
      !currencies.includes(currency as (typeof currencies)[number])
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid currency",
      });
    }

    if (
      status &&
      !BOOKING_STATUSES.includes(status as BookingStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }

    const clauses: Array<Record<string, unknown>> = [];

    if (source === "ONLINE") {
      clauses.push({
        $or: [
          { source: "ONLINE" },
          { source: { $exists: false } },
          { source: null },
        ],
      });
    }

    if (source === "WALK_IN") {
      clauses.push({ source: "WALK_IN" });
    }

    if (eventTypeKey) {
      clauses.push({ eventTypeKey });
    }

    if (currency) {
      clauses.push({ currency });
    }

    if (status) {
      clauses.push({ status });
    }

    if (agent === "unassigned") {
      clauses.push({
        $or: [
          { assignedAgent: { $exists: false } },
          { assignedAgent: null },
        ],
      });
    } else if (agent) {
      if (!mongoose.isValidObjectId(agent)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assigned-agent filter",
        });
      }

      const assignableAgent = await User.exists({
        _id: agent,
        role: { $in: ["RECEPTION", "MANAGER"] },
      });

      if (!assignableAgent) {
        return res.status(400).json({
          success: false,
          message: "The selected agent is not assignable",
        });
      }

      clauses.push({ assignedAgent: agent });
    }

    if (search) {
      const expression = new RegExp(escapeRegex(search), "i");

      const matchingUsers = await User.find({
        $or: [
          { name: expression },
          { email: expression },
          { phone: expression },
        ],
      })
        .select("_id")
        .limit(100)
        .lean();

      clauses.push({
        $or: [
          { guestPhone: expression },
          { eventTypeKey: expression },
          { eventDate: expression },
          {
            userId: {
              $in: matchingUsers.map((user) => user._id),
            },
          },
        ],
      });
    }

    const filter = clauses.length > 0 ? { $and: clauses } : {};

    const [bookings, total, eventTypes] = await Promise.all([
      Booking.find(filter)
        .populate("userId", "name email phone")
        .populate("assignedAgent", "name email role")
        .sort({ eventDate: 1, slot: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Booking.countDocuments(filter),

      EventType.find()
        .select("key name active")
        .sort({ key: 1 })
        .lean(),
    ]);

    return res.json({
      success: true,
      bookings: bookings.map((booking: any) => ({
        id: booking._id.toString(),
        source: booking.source || "ONLINE",
        eventDate: booking.eventDate,
        slot: booking.slot,
        eventTypeKey: booking.eventTypeKey,
        packKey: booking.packKey,
        pricingMarket: booking.pricingMarket,
        currency: booking.currency,
        totalDZD: booking.totalDZD,
        depositDZD: booking.depositDZD,
        status: booking.status,
        womenGuests: booking.womenGuests,
        menGuests: booking.menGuests,
        guestPhone: booking.guestPhone,
        client: booking.userId
          ? {
              id: booking.userId._id.toString(),
              name: booking.userId.name,
              email: booking.userId.email,
              phone: booking.userId.phone,
            }
          : null,
        assignedAgent: booking.assignedAgent
          ? {
              id: booking.assignedAgent._id.toString(),
              name: booking.assignedAgent.name,
              email: booking.assignedAgent.email,
              role: booking.assignedAgent.role,
            }
          : null,
        createdAt: booking.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      filters: {
        eventTypes: eventTypes.map((eventType) => ({
          key: eventType.key,
          name: eventType.name,
          active: eventType.active,
        })),
      },
    });
  } catch (error) {
    console.error("Admin bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load bookings",
    });
  }
}

export async function getAssignableAgents(_req: Request, res: Response) {
  try {
    const agents = await User.find({
      role: { $in: ["RECEPTION", "MANAGER"] },
    })
      .select("name email role")
      .sort({ name: 1 })
      .lean();

    return res.json({
      success: true,
      agents: agents.map((agent) => ({
        id: agent._id.toString(),
        name: agent.name,
        email: agent.email,
        role: agent.role,
      })),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load agents",
    });
  }
}