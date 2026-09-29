import mongoose, { Schema } from "mongoose";

export const CONTACT_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "RESOLVED",
  "ARCHIVED",
] as const;

export const CONTACT_REQUEST_TYPES = [
  "GENERAL",
  "APPOINTMENT",
] as const;

export const CONTACT_APPOINTMENT_SLOTS = [
  "DAY",
  "EVENING",
  "NIGHT",
] as const;

export const CONTACT_APPOINTMENT_TYPES = [
  "VISIT",
  "VIDEO",
] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export interface IContactMessage {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  language: "fr-DZ" | "ar-DZ" | "en";
  callbackSlot: string;
  source: string;
  status: ContactStatus;
  assignedTo?: mongoose.Types.ObjectId;
  replyText?: string;
  repliedAt?: Date;
  repliedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  requestType: (typeof CONTACT_REQUEST_TYPES)[number];
requestedAppointmentType?: (typeof CONTACT_APPOINTMENT_TYPES)[number];
requestedAppointmentSlot?: (typeof CONTACT_APPOINTMENT_SLOTS)[number];
}


const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    language: {
      type: String,
      enum: ["fr-DZ", "ar-DZ", "en"],
      required: true,
    },

    callbackSlot: {
      type: String,
      required: true,
      trim: true,
    },

    source: {
      type: String,
      required: true,
      trim: true,
    },
    requestType: {
  type: String,
  enum: CONTACT_REQUEST_TYPES,
  default: "GENERAL",
  required: true,
},
requestedAppointmentType: {
  type: String,
  enum: CONTACT_APPOINTMENT_TYPES,
},
requestedAppointmentSlot: {
  type: String,
  enum: CONTACT_APPOINTMENT_SLOTS,
},
    status: {
  type: String,
  enum: CONTACT_STATUSES,
  default: "NEW",
  required: true,
},

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    replyText: {
  type: String,
  trim: true,
  maxlength: 3000,
},
repliedAt: {
  type: Date,
},
repliedBy: {
  type: Schema.Types.ObjectId,
  ref: "User",
},
  },
  {
    timestamps: true,
  }
);
contactMessageSchema.index({
  requestType: 1,
  status: 1,
  createdAt: -1,
});
contactMessageSchema.index({
  assignedTo: 1,
  status: 1,
  createdAt: -1,
});
export const ContactMessage = mongoose.model<IContactMessage>(
  "ContactMessage",
  contactMessageSchema
);