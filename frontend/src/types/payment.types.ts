export type PaymentMethod =
  | "CCP"
  | "BARIDIMOB"
  | "VIREMENT";

export type PaymentStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type Payment = {
  id: string;
  bookingId: string;
  method: PaymentMethod;
  amountDZD: number;
  reference?: string;
  proofUrl?: string;
  status: PaymentStatus;
  rejectionReason?: string;
};

export type PaymentInstruction = {
  enabled: boolean;
  label: string;
  details: string | null;
};

export type PaymentInstructions = Record<
  PaymentMethod,
  PaymentInstruction
>;