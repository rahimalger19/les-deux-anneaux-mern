import mongoose, { Schema } from "mongoose";

export const APPOINTMENT_TYPES = ["VISIT", "VIDEO"] as const;
export const APPOINTMENT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
] as const;

export const APPOINTMENT_SOURCES = ["ACCOUNT", "CONTACT"] as const;
export const APPOINTMENT_SLOTS = ["DAY", "EVENING", "NIGHT"] as const;

export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export type AppointmentSource = (typeof APPOINTMENT_SOURCES)[number];
export type AppointmentSlot = (typeof APPOINTMENT_SLOTS)[number];

export interface IAppointment {
  userId?: mongoose.Types.ObjectId;
  contactMessageId?: mongoose.Types.ObjectId;

  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;

  source: AppointmentSource;
  type: AppointmentType;
  requestedSlot?: AppointmentSlot;
  appointmentSlot?: AppointmentSlot;

  scheduledAt?: Date;
  timezone: string;
  notes?: string;
  status: AppointmentStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    contactMessageId: {
      type: Schema.Types.ObjectId,
      ref: "ContactMessage",
      unique: true,
      sparse: true,
    },
    guestName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    guestPhone: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    source: {
      type: String,
      enum: APPOINTMENT_SOURCES,
      default: "ACCOUNT",
      required: true,
    },
    type: {
      type: String,
      enum: APPOINTMENT_TYPES,
      required: true,
    },
    requestedSlot: {
      type: String,
      enum: APPOINTMENT_SLOTS,
    },
    appointmentSlot: {
      type: String,
      enum: APPOINTMENT_SLOTS,
    },
    scheduledAt: {
      type: Date,
    },
    timezone: {
      type: String,
      default: "Africa/Algiers",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: "PENDING",
      required: true,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ status: 1, scheduledAt: 1 });
appointmentSchema.index({ source: 1, status: 1, createdAt: -1 });

export const Appointment = mongoose.model<IAppointment>(
  "Appointment",
  appointmentSchema
);