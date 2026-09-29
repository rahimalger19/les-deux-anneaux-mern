import { api } from "../api/client";

export type StaffRole =
  | "RECEPTION"
  | "MANAGER"
  | "COMPTA"
  | "READONLY";

export type SuperTeamUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: StaffRole;
  createdAt: string;
};

export async function getSuperTeam() {
  const response = await api.get<{
    success: boolean;
    users: SuperTeamUser[];
  }>("/super/team");

  return response.data.users;
}

export async function createSuperTeamUser(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: StaffRole;
}) {
  const response = await api.post("/super/team", data);
  return response.data;
}

export async function updateSuperTeamUserRole(
  userId: string,
  role: StaffRole
) {
  const response = await api.patch(`/super/team/${userId}`, {
    role,
  });

  return response.data;
}