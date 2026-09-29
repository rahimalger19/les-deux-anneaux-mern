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

export type PaymentInstructions = {
  CCP: {
    enabled: boolean;
    label: string;
    accountName: string;
    rip: string;
    reason: string;
  };

  BARIDIMOB: {
    enabled: boolean;
    label: string;
    accountNumber: string;
    qrUrl: string | null;
  };

  VIREMENT: {
    enabled: boolean;
    label: string;
    bankName: string;
    accountName: string;
    rib: string;
  };
};