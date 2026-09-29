import { EventType } from "../models/EventType";
import { Pack } from "../models/Pack";
import {
  PricingRule,
  type PricingDayType,
} from "../models/PricingRule";
import { PricingSeason } from "../models/PricingSeason";
import type {
  BookingSlot,
  PricingMarket,
} from "../models/Booking";
import { Service } from "../models/Service";

type EstimateInput = {
  eventTypeKey: string;
  packKey: string;
  womenGuests: number;
  menGuests: number;
  slot: BookingSlot;
  pricingMarket: PricingMarket;
  eventDate?: string;
  optionKeys?: string[];
};

function getMonthDay(eventDate?: string) {
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return null;
  }

  return eventDate.slice(5);
}

function isInsidePeriod(
  monthDay: string,
  startMonthDay: string,
  endMonthDay: string
) {
  if (startMonthDay <= endMonthDay) {
    return monthDay >= startMonthDay && monthDay <= endMonthDay;
  }

  return monthDay >= startMonthDay || monthDay <= endMonthDay;
}

async function resolveSeason(eventDate?: string) {
  const monthDay = getMonthDay(eventDate);

  if (!monthDay) {
    return "NORMAL" as const;
  }

  const seasons = await PricingSeason.find({ active: true })
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  const season = seasons.find((item) =>
    isInsidePeriod(monthDay, item.startMonthDay, item.endMonthDay)
  );

  return season?.key || "NORMAL";
}

function resolveDayType(eventDate?: string): PricingDayType {
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return "ALL";
  }

  const [year, month, day] = eventDate.split("-").map(Number);
  const weekDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return weekDay === 0 || weekDay === 6 ? "WEEKEND" : "WEEKDAY";
}

export async function calculateBookingEstimate(input: EstimateInput) {
  const totalGuests = input.womenGuests + input.menGuests;

  const eventType = await EventType.findOne({
    key: input.eventTypeKey,
    active: true,
  });

  if (!eventType) {
    throw new Error("Event type not found");
  }

  if (
    input.womenGuests > eventType.womenCapacity ||
    input.menGuests > eventType.menCapacity
  ) {
    throw new Error("Guest capacity is exceeded for this event type");
  }

  const pack = await Pack.findOne({
    key: input.packKey,
    active: true,
  });

  if (!pack) {
    throw new Error("Pack not found");
  }

  if (!eventType.allowedSlots.includes(input.slot)) {
    throw new Error("This slot is not allowed for this event type");
  }

  const season = await resolveSeason(input.eventDate);
  const dayType = resolveDayType(input.eventDate);

  const rules = await PricingRule.find({
    market: input.pricingMarket,
    slot: input.slot,
    season: {
      $in: season === "NORMAL" ? ["NORMAL"] : [season, "NORMAL"],
    },
    minGuests: { $lte: totalGuests },
    maxGuests: { $gte: totalGuests },
    active: true,
    $or: [
      { dayType },
      { dayType: "ALL" },
      { dayType: { $exists: false } },
    ],
  }).lean();

  const pricingRule = rules.sort((left, right) => {
    const leftSeasonPriority = left.season === season ? 0 : 1;
    const rightSeasonPriority = right.season === season ? 0 : 1;

    if (leftSeasonPriority !== rightSeasonPriority) {
      return leftSeasonPriority - rightSeasonPriority;
    }

    const leftDayPriority = left.dayType === dayType ? 0 : 1;
    const rightDayPriority = right.dayType === dayType ? 0 : 1;

    return leftDayPriority - rightDayPriority;
  })[0];

  if (!pricingRule) {
    throw new Error("No price grid is configured for this selection");
  }

  const packBasePriceDZD =
    input.pricingMarket === "DIASPORA"
      ? pack.diasporaBasePriceDZD
      : pack.basePriceDZD;

  const packExtraGuestPriceDZD =
    input.pricingMarket === "DIASPORA"
      ? pack.diasporaExtraGuestPriceDZD
      : pack.extraGuestPriceDZD;

  const depositPercent =
    input.pricingMarket === "DIASPORA"
      ? eventType.diasporaDepositPercent
      : eventType.depositPercent;

  if (
    packBasePriceDZD === undefined ||
    packExtraGuestPriceDZD === undefined ||
    depositPercent === undefined
  ) {
    throw new Error(
      "Diaspora price grid or diaspora deposit percentage is not configured"
    );
  }

  const cleanOptionKeys = [
    ...new Set(
      (input.optionKeys || [])
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0
        )
        .map((value) => value.trim())
    ),
  ];

  const selectedServices = await Service.find({
    key: { $in: cleanOptionKeys },
    active: true,
  })
    .select("key priceDZD")
    .lean();

  if (selectedServices.length !== cleanOptionKeys.length) {
    throw new Error("One or more selected services are unavailable");
  }

  if (selectedServices.some((service) => service.priceDZD === undefined)) {
    throw new Error("A selected service has no configured price");
  }

  const selectedServicesDZD = selectedServices.reduce(
    (total, service) => total + (service.priceDZD || 0),
    0
  );

  const extraGuests = Math.max(0, totalGuests - pack.includedGuests);
  const baseDZD = Math.max(pricingRule.priceDZD, packBasePriceDZD);
  const extraGuestsDZD = extraGuests * packExtraGuestPriceDZD;
  const totalDZD = baseDZD + extraGuestsDZD + selectedServicesDZD;
  const depositDZD = Math.round(totalDZD * (depositPercent / 100));

  return {
    eventType: {
      key: eventType.key,
      depositPercent,
      womenCapacity: eventType.womenCapacity,
      menCapacity: eventType.menCapacity,
      bufferMinutes: eventType.bufferMinutes || 0,
    },
    pack: {
      key: pack.key,
      includedGuests: pack.includedGuests,
      basePriceDZD: packBasePriceDZD,
    },
    pricing: {
      market: input.pricingMarket,
      slot: input.slot,
      season: pricingRule.season,
      dayType,
      baseDZD,
      extraGuests,
      extraGuestsDZD,
      selectedServicesDZD,
      selectedServiceKeys: selectedServices.map((service) => service.key),
      totalDZD,
      depositDZD,
      currency: "DZD",
    },
  };
}