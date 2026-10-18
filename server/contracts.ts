export const BOOKING_SERVICES = [
  { id: "svc-home-weekly", name: "Slate Home" },
  { id: "svc-home-lite", name: "Slate Home Lite" },
  { id: "svc-bulk", name: "Bulk Waste Pickup" },
  { id: "svc-recycling", name: "Recycling Pickup" },
  { id: "svc-special", name: "Special Collection" },
  { id: "svc-event", name: "Event Cleanup" },
] as const;

export const BOOKING_WINDOWS = ["morning", "afternoon"] as const;
export const BOOKING_AREAS = ["Ewet Housing Estate", "Shelter Afrique Estate", "Osongama Estate", "Aka Road", "Oron Road", "Ikot Ekpene Road", "Nwaniba Road", "Udo Udoma Avenue", "Wellington Bassey Way", "Abak Road", "Itam", "Use Offot"] as const;
export const TERMS_VERSION = "2026-10-18";
export const ENQUIRY_CATEGORIES = ["New service", "Existing service", "Operator partnership", "Proposal", "Waitlist"] as const;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "household";
}

export interface BookingInput {
  serviceId: string;
  address: string;
  area: string;
  date: string;
  window: (typeof BOOKING_WINDOWS)[number];
  notes?: string;
}

export interface Booking extends BookingInput {
  id: string;
  reference: string;
  serviceName: string;
  status: "requested" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface TicketInput {
  subject: string;
  message: string;
  bookingId?: string;
}

export interface SupportTicket extends TicketInput {
  id: string;
  reference: string;
  status: "open";
  createdAt: string;
}

export interface EnquiryInput {
  name: string;
  email: string;
  phone?: string;
  category: (typeof ENQUIRY_CATEGORIES)[number];
  message: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
  requestId: string;
}
