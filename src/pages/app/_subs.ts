/**
 * Customer subscriptions — page-local demo data for C6/C7 and the booking flow.
 * The story: Imaobong lived at 6 Nwaniba Road on Slate Home Lite from April,
 * moved to Ewet Housing Estate on 13 Jul (Slate Home since), signed up for
 * monthly recycling after the 22 Sep one-off, and cancelled the family house
 * service on Ikot Ekpene Road when it was sold.
 */
import { me } from "@/data";

export type SubStatus = "Active" | "Pending" | "Paused" | "Cancelled";
export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface SubPayment {
  ref: string;
  label: string;
  date: string;
  amount: number;
  method: string;
  status: "Successful" | "Failed" | "Pending" | "Refunded";
  note?: string;
}

export interface Subscription {
  id: string;
  ref: string;
  serviceId: string;
  service: string;
  property: string;
  address: string;
  landmark?: string;
  operatorId: string | null;
  operator: string | null;
  price: number;
  frequency: string;
  days: Weekday[];
  window: string;
  bins: number;
  nextPickup: string | null;
  nextPickupId?: string;
  nextPayment: string | null;
  status: SubStatus;
  started: string;
  paymentMethod: string;
  /** One line that explains the current state in plain words. */
  statusNote: string;
  pausedOn?: string;
  cancelledOn?: string;
  cancelReason?: string;
  history: SubPayment[];
  performance?: {
    since: string;
    completed: number;
    scheduled: number;
    missed: number;
    complaints: number;
    onTime: number;
    weeks: string[];
    done: number[];
    missedByWeek: number[];
  };
}

const at = (date: string, time = "07:00") => new Date(`${date}T${time}:00+01:00`).toISOString();

export const SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-1",
    ref: "SUB-26-0187",
    serviceId: "svc-home-weekly",
    service: "Slate Home",
    property: "Home",
    address: me.household.address,
    landmark: me.household.landmark,
    operatorId: "op-ufok",
    operator: "Ufok Environmental",
    price: 7000,
    frequency: "Twice weekly",
    days: ["Mon", "Thu"],
    window: "07:00–09:00",
    bins: 1,
    nextPickup: at("2026-10-05"),
    nextPickupId: "PU-26-08813",
    nextPayment: at("2026-11-01", "06:00"),
    status: "Active",
    started: at("2026-07-13"),
    paymentMethod: "Visa •• 4021",
    statusNote: "Collected twice a week since 13 Jul",
    history: [
      { ref: "TXN-7Q4K2M", label: "October", date: at("2026-10-01", "06:02"), amount: 7000, method: "Visa •• 4021", status: "Successful" },
      { ref: "TXN-4C9TBB", label: "September", date: at("2026-09-02", "12:30"), amount: 7000, method: "Visa •• 4021", status: "Successful", note: "Retried on Visa after Verve declined" },
      { ref: "TXN-4C9TBA", label: "September", date: at("2026-09-01", "06:01"), amount: 7000, method: "Verve •• 7735", status: "Failed", note: "Declined 3 times — insufficient funds" },
      { ref: "TXN-3PQ7LE", label: "August", date: at("2026-08-01", "06:03"), amount: 7000, method: "Visa •• 4021", status: "Successful" },
      { ref: "TXN-2KV8NA", label: "July, from 13 Jul", date: at("2026-07-13", "09:41"), amount: 4290, method: "Visa •• 4021", status: "Successful", note: "Pro-rated for 19 days" },
    ],
    performance: {
      since: "13 Jul",
      completed: 24,
      scheduled: 25,
      missed: 1,
      complaints: 2,
      onTime: 98,
      weeks: ["13", "20", "27", "3", "10", "17", "24", "31", "7", "14", "21", "28"],
      done: [2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 1],
      missedByWeek: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    },
  },
  {
    id: "sub-2",
    ref: "SUB-26-0412",
    serviceId: "svc-recycling",
    service: "Recycling Pickup",
    property: "Home",
    address: me.household.address,
    landmark: me.household.landmark,
    operatorId: null,
    operator: null,
    price: 1500,
    frequency: "Monthly",
    days: ["Tue"],
    window: "14:00–16:00",
    bins: 0,
    nextPickup: at("2026-10-13", "14:00"),
    nextPayment: at("2026-10-13", "06:00"),
    status: "Pending",
    started: at("2026-10-13", "14:00"),
    paymentMethod: "Visa •• 4021",
    statusNote: "Starts Tue 13 Oct — second Tuesday of each month",
    history: [],
  },
  {
    id: "sub-3",
    ref: "SUB-26-0031",
    serviceId: "svc-home-lite",
    service: "Slate Home Lite",
    property: "Previous address",
    address: "Flat 2, 6 Nwaniba Road, Uyo",
    landmark: "Behind Mobil filling station",
    operatorId: "op-nwaniba",
    operator: "Nwaniba Clean Crew",
    price: 4500,
    frequency: "Weekly",
    days: ["Sat"],
    window: "08:00–10:00",
    bins: 1,
    nextPickup: null,
    nextPayment: null,
    status: "Paused",
    started: at("2026-04-11", "08:00"),
    paymentMethod: "Visa •• 4021",
    statusNote: "Paused since 12 Jul, when you moved to Ewet",
    pausedOn: at("2026-07-12", "18:20"),
    history: [
      { ref: "TXN-1VB4RT", label: "July, to 12 Jul", date: at("2026-07-01", "06:00"), amount: 1740, method: "Visa •• 4021", status: "Successful", note: "Pro-rated when paused" },
      { ref: "TXN-1QM7PE", label: "June", date: at("2026-06-01", "06:00"), amount: 4500, method: "Visa •• 4021", status: "Successful" },
      { ref: "TXN-1HK2WD", label: "May", date: at("2026-05-01", "06:01"), amount: 4500, method: "Visa •• 4021", status: "Successful" },
      { ref: "TXN-0ZD9LA", label: "April, from 11 Apr", date: at("2026-04-11", "11:15"), amount: 3000, method: "Visa •• 4021", status: "Successful", note: "Pro-rated for 20 days" },
    ],
    performance: {
      since: "11 Apr",
      completed: 13,
      scheduled: 13,
      missed: 0,
      complaints: 0,
      onTime: 92,
      weeks: ["20", "27", "4", "11", "18", "25", "1", "8", "15", "22", "29", "6"],
      done: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      missedByWeek: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  {
    id: "sub-4",
    ref: "SUB-26-0096",
    serviceId: "svc-home-weekly",
    service: "Slate Home",
    property: "Family house",
    address: "33 Ikot Ekpene Road, Uyo",
    operatorId: "op-nwaniba",
    operator: "Nwaniba Clean Crew",
    price: 8200,
    frequency: "Twice weekly",
    days: ["Tue", "Fri"],
    window: "06:00–08:00",
    bins: 2,
    nextPickup: null,
    nextPayment: null,
    status: "Cancelled",
    started: at("2026-05-20", "06:00"),
    paymentMethod: "Visa •• 4021",
    statusNote: "Cancelled on 2 Sep — the house was sold",
    cancelledOn: at("2026-09-02", "16:05"),
    cancelReason: "Moving or property sold",
    history: [
      { ref: "TXN-3RT6YH", label: "September, 1–2 Sep", date: at("2026-09-02", "16:06"), amount: 470, method: "Visa •• 4021", status: "Refunded", note: "₦6,530 refunded for unused days" },
      { ref: "TXN-3BN2QS", label: "August", date: at("2026-08-01", "06:00"), amount: 8200, method: "Visa •• 4021", status: "Successful" },
    ],
  },
];

export const subById = (id: string) => SUBSCRIPTIONS.find((s) => s.id === id || s.ref === id);

export const PAUSE_REASONS = ["Travelling", "Property empty for now", "Moving house", "Money is tight this month", "Other"];
export const CANCEL_REASONS = ["Moving or property sold", "Too expensive", "Service quality", "Switching to my estate's service", "I no longer need it", "Other"];
