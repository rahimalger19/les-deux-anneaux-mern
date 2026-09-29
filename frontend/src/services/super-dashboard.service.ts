import { api } from "../api/client";

export type SuperDashboard = {
  success: boolean;
  revenue: {
    totalDZD: number;
    invoicedBookings: number;
  };
  onlineFunnel: {
    started: number;
    otpPending: number;
    held: number;
    proofPending: number;
    invoiced: number;
    done: number;
  };
  slotDistribution: {
    night: number;
    day: number;
  };
  instagram: {
    tracked: boolean;
    message: string;
  };
};

export async function getSuperDashboard() {
  const response = await api.get<SuperDashboard>("/super/dashboard");
  return response.data;
}