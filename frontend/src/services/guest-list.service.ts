import { api } from "../api/client";

export type GuestListEntry = {
  name: string;
  gender: "WOMAN" | "MAN";
};

export type GuestListResponse = {
  booking: {
    id: string;
    eventDate: string;
    eventTypeKey: string;
  };
  capacity: {
    women: number;
    men: number;
  };
  guestList: {
    entries: GuestListEntry[];
    womenCount: number;
    menCount: number;
  } | null;
};

export async function getMyGuestList(bookingId: string) {
  const response = await api.get<{
    success: boolean;
  } & GuestListResponse>(`/guest-lists/my/${bookingId}`);

  return response.data;
}

export async function importMyGuestList(
  bookingId: string,
  file: File
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/guest-lists/my/${bookingId}/import`,
    formData
  );

  return response.data;
}