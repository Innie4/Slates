export type CustomerType = "Household" | "Estate" | "Business" | "Institution";
export type Role = "household" | "estate" | "business" | "institution" | "operator" | "admin";

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  email: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  plan: string;
  monthly: number;
  status: "Active" | "Paused" | "Suspended" | "Cancelled" | "Pending";
  paymentStatus: "Paid" | "Overdue" | "Failed" | "Pending";
  operatorId: string;
  joined: string;
  sites?: number;
}

export interface Operator {
  id: string;
  name: string;
  short: string;
  focus: string;
  city: string;
  areas: string[];
  wasteTypes: string[];
  vehicles: number;
  staff: number;
  capacity: number;
  assigned: number;
  status: "Active" | "Pending" | "Under review" | "More information required" | "Suspended" | "Rejected" | "Approved" | "Submitted" | "Draft";
  score: number;
  completion: number;
  missed30d: number;
  complaints30d: number;
  rating: number;
  responseMins: number;
  contact: string;
  phone: string;
  email: string;
  joined: string;
  docsExpiring: number;
  payoutMonthly: number;
  rc: string;
}

export type PickupStatus = "Scheduled" | "En route" | "Arrived" | "Completed" | "Missed" | "Failed" | "Cancelled" | "Late" | "In progress";

export interface Pickup {
  id: string;
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  address: string;
  area: string;
  service: string;
  operatorId: string;
  operatorName: string;
  date: string;
  window: string;
  status: PickupStatus;
  driver: string;
  vehicle: string;
  completedAt?: string;
  bins?: number;
  note?: string;
}

export interface Payment {
  id: string;
  reference: string;
  customerName: string;
  customerType: CustomerType;
  service: string;
  amount: number;
  fee: number;
  operatorAllocation: number;
  slateRevenue: number;
  date: string;
  method: string;
  processor: "Paystack" | "Flutterwave";
  status: "Successful" | "Pending" | "Failed" | "Refunded" | "Chargeback";
  attempts: number;
}

export interface Complaint {
  id: string;
  customerName: string;
  customerType: CustomerType;
  operatorName: string;
  service: string;
  pickupId?: string;
  issue: string;
  category: "Missed pickup" | "Late pickup" | "Spillage" | "Billing" | "Conduct" | "Damaged bin" | "Other";
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "New" | "Assigned" | "Investigating" | "Waiting" | "Resolved" | "Closed" | "Escalated" | "Open" | "In progress";
  created: string;
  slaDue: string;
  assignee: string;
  evidence: number;
}

export interface Contract {
  id: string;
  operatorId: string;
  operatorName: string;
  areas: string[];
  serviceTypes: string[];
  customerPrice: number;
  operatorPayout: number;
  capacity: number;
  customers: number;
  slaCompletion: number;
  responseHours: number;
  paymentTerms: string;
  penalties: string;
  start: string;
  end: string;
  status: "Draft" | "Internal review" | "Negotiation" | "Sent to operator" | "Accepted" | "Active" | "Expiring" | "Renewal approaching" | "Terminated" | "Expired";
  monthlyValue: number;
  version: number;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  category: "Household Waste" | "Commercial Waste" | "Estate Waste Management" | "Institutional Waste" | "Bulk Waste" | "Recycling" | "Special Collection" | "Event Cleanup";
  short: string;
  description: string;
  included: string[];
  frequency: string;
  frequencies: string[];
  priceFrom: number;
  priceUnit: string;
  eligible: CustomerType[];
  wasteTypes: string[];
  requirements: string[];
  availability: "Available" | "Limited" | "Waitlist";
  pricingModel: "Monthly subscription" | "Per pickup" | "Quote" | "Per household";
}

export interface Invoice {
  id: string;
  customerName: string;
  period: string;
  issued: string;
  due: string;
  amount: number;
  status: "Paid" | "Unpaid" | "Overdue" | "Partial" | "Draft" | "Sent";
  lines: Array<{ label: string; qty: number; unit: number }>;
}

export interface Payout {
  id: string;
  operatorName: string;
  operatorId: string;
  period: string;
  jobs: number;
  gross: number;
  deductions: number;
  adjustments: number;
  net: number;
  status: "Paid" | "Pending" | "Processing" | "Failed" | "Scheduled";
  date: string;
}

export interface CommunityProject {
  id: string;
  title: string;
  community: string;
  description: string;
  target: number;
  raised: number;
  contributors: number;
  deadline: string;
  status: "Active" | "Funded" | "Completed" | "Released" | "Draft" | "Closed";
  provider: string;
  failedPayments: number;
  category: string;
}

export interface Ticket {
  id: string;
  from: string;
  kind: "Customer" | "Operator";
  subject: string;
  channel: "In-app" | "Email" | "Phone" | "WhatsApp";
  priority: "Low" | "Normal" | "High" | "Urgent";
  status: "Open" | "Pending" | "Waiting" | "Resolved" | "Closed" | "Escalated";
  assignee: string;
  created: string;
  sla: string;
}

export interface Review {
  id: string;
  customerName: string;
  operatorName: string;
  rating: number;
  punctuality: number;
  professionalism: number;
  quality: number;
  comment: string;
  date: string;
  status: "Published" | "Flagged" | "Hidden";
}

export interface NotificationItem {
  id: string;
  category: "Pickups" | "Payments" | "Service" | "Community" | "Promotions" | "Support" | "Operator" | "System" | "Contracts";
  title: string;
  body: string;
  time: string;
  read: boolean;
  to?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  owner: string;
  category: "Operator documents" | "Contracts" | "Compliance documents" | "Customer documents" | "Financial documents" | "Government documents";
  uploaded: string;
  expires?: string;
  status: "Verified" | "Pending" | "Expiring" | "Expired" | "Rejected";
  version: number;
  size: string;
}

export interface AuditEntry {
  id: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  previous: string;
  next: string;
  time: string;
  ip: string;
}

export interface Vehicle {
  id: string;
  registration: string;
  type: string;
  capacity: string;
  status: "Active" | "In maintenance" | "Inactive";
  driver: string;
  docStatus: "Verified" | "Expiring" | "Expired";
  inspection: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  verification: "Verified" | "Pending" | "Expired";
  status: "On shift" | "Off shift" | "Suspended";
  jobsToday: number;
  rating: number;
}

export interface Partner {
  id: string;
  name: string;
  type: "Waste company" | "Recycling company" | "Estate" | "Property developer" | "Institution" | "Corporate partner" | "Government" | "Payment provider" | "Financial partner";
  contact: string;
  agreement: string;
  status: "Active" | "Negotiation" | "Pending" | "Inactive";
  locations: string[];
  since: string;
  services: string[];
}

export interface City {
  id: string;
  name: string;
  state: string;
  status: "Live" | "Launching" | "Planned";
  customers: number;
  operators: number;
  revenue: number;
  completion: number;
  regulatory: number;
  demand: number;
  launch: string;
}

export interface RecyclingPartner {
  id: string;
  name: string;
  materials: string[];
  rate: string;
  volumeKg: number;
  payout: number;
  status: "Active" | "Pending";
  score: number;
}

export interface SmartSweepPlan {
  id: string;
  customerName: string;
  owed: number;
  collected: number;
  maxCharge: number;
  frequency: string;
  nextCharge: string;
  status: "Active" | "Paused" | "Failed" | "Completed";
  failures: number;
}

export interface Chargeback {
  id: string;
  customerName: string;
  amount: number;
  reason: string;
  opened: string;
  respondBy: string;
  status: "Open" | "Evidence submitted" | "Won" | "Lost";
  processor: "Paystack" | "Flutterwave";
  txn: string;
}
