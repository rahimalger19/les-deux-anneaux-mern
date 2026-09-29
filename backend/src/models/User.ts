import mongoose, { Schema, type Document } from "mongoose";

export type UserRole =
  | "CLIENT"
  | "RECEPTION"
  | "MANAGER"
  | "COMPTA"
  | "READONLY"
  | "SUPER_ADMIN";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  country?: string;
  profilePhotoUrl?: string;
  language: "fr-DZ" | "ar-DZ" | "en";
  currency: "DZD" | "EUR" | "USD";
  newsletterOptIn: boolean;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  role: UserRole;
  createdAt?: Date;
updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: { type: String, required: true },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    country: {
  type: String,
  trim: true,
  maxlength: 100,
},
profilePhotoUrl: {
  type: String,
  trim: true,
},

    language: {
      type: String,
      enum: ["fr-DZ", "ar-DZ", "en"],
      default: "fr-DZ",
      required: true,
    },

    currency: {
      type: String,
      enum: ["DZD", "EUR", "USD"],
      default: "DZD",
      required: true,
    },

    newsletterOptIn: {
      type: Boolean,
      default: false,
      required: true,
    },

    twoFactorEnabled: {
  type: Boolean,
  default: false,
  required: true,
},

    emailNotifications: {
  type: Boolean,
  default: true,
  required: true,
},
smsNotifications: {
  type: Boolean,
  default: false,
  required: true,
},

    role: {
      type: String,
      enum: [
        "CLIENT",
        "RECEPTION",
        "MANAGER",
        "COMPTA",
        "READONLY",
        "SUPER_ADMIN",
      ],
      default: "CLIENT",
      required: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);