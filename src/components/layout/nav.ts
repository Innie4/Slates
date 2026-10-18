import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, CalendarClock, Truck, CreditCard, Wallet, Receipt, MessageSquareWarning, Recycle, HeartHandshake, LifeBuoy,
  Settings, Bell, User, Building2, MapPin, FileText, FileSignature, BarChart3, ClipboardList, Route, CalendarDays, Car, IdCard, Star,
  FolderOpen, ShieldCheck, Landmark, Layers, Megaphone, Globe2, Handshake, KeyRound, History, Banknote, RotateCcw,
  Repeat, Users, Boxes, UserCog, Inbox, Network, Scale, Briefcase, Gauge, Home, Coins,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
  /** match nested routes too (default true) */
  end?: boolean;
}
export interface NavGroup {
  label?: string;
  items: NavItem[];
}
export interface PortalConfig {
  key: "app" | "estate" | "business" | "institution" | "operator" | "admin";
  label?: string;
  base: string;
  groups: NavGroup[];
  /** 4 destinations for the mobile tab bar; the 5th is "More" */
  tabs: NavItem[];
  primaryAction?: { label: string; to: string };
}

export const customerNav: PortalConfig = {
  key: "app",
  base: "/app",
  primaryAction: { label: "Book pickup", to: "/app/book" },
  groups: [
    {
      items: [
        { label: "Home", to: "/app/dashboard", icon: Home },
        { label: "Pickups", to: "/app/pickups", icon: Truck },
        { label: "Services", to: "/app/services", icon: Layers },
        { label: "Subscriptions", to: "/app/subscriptions", icon: Repeat },
      ],
    },
    {
      label: "Money",
      items: [
        { label: "Payments", to: "/app/payments", icon: CreditCard },
        { label: "Payment methods", to: "/app/payment-methods", icon: Wallet },
        { label: "Smart Sweep", to: "/app/smart-sweep", icon: Coins },
        { label: "Receipts", to: "/app/receipts", icon: Receipt },
      ],
    },
    {
      label: "Community",
      items: [
        { label: "Community", to: "/app/community", icon: HeartHandshake },
        { label: "Recycling", to: "/app/recycling", icon: Recycle },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Complaints", to: "/app/complaints", icon: MessageSquareWarning },
        { label: "Support", to: "/app/support", icon: LifeBuoy },
        { label: "Notifications", to: "/app/notifications", icon: Bell, badge: 2 },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Profile", to: "/app/profile", icon: User },
        { label: "Settings", to: "/app/settings", icon: Settings },
      ],
    },
  ],
  tabs: [
    { label: "Home", to: "/app/dashboard", icon: Home },
    { label: "Pickups", to: "/app/pickups", icon: Truck },
    { label: "Payments", to: "/app/payments", icon: CreditCard },
    { label: "Community", to: "/app/community", icon: HeartHandshake },
  ],
};

export const liveCustomerNav: PortalConfig = {
  key: "app", base: "/app",
  primaryAction: { label: "Request collection", to: "/app/book" },
  groups: [
    { items: [
      { label: "Home", to: "/app/dashboard", icon: Home },
      { label: "Collection requests", to: "/app/pickups", icon: Truck },
      { label: "Services", to: "/app/services", icon: Layers },
    ] },
    { label: "Your account", items: [
      { label: "Support", to: "/app/support", icon: LifeBuoy },
      { label: "Activity", to: "/app/notifications", icon: Bell },
      { label: "Billing", to: "/app/payments", icon: CreditCard },
      { label: "Profile and settings", to: "/app/profile", icon: User },
    ] },
  ],
  tabs: [
    { label: "Home", to: "/app/dashboard", icon: Home },
    { label: "Requests", to: "/app/pickups", icon: Truck },
    { label: "Services", to: "/app/services", icon: Layers },
    { label: "Support", to: "/app/support", icon: LifeBuoy },
  ],
};

export const estateNav: PortalConfig = {
  key: "estate",
  label: "Estate",
  base: "/estate",
  groups: [
    {
      items: [
        { label: "Overview", to: "/estate/dashboard", icon: LayoutDashboard },
        { label: "Properties", to: "/estate/properties", icon: Building2 },
        { label: "Residents", to: "/estate/residents", icon: Users },
        { label: "Service", to: "/estate/services", icon: FileSignature },
        { label: "Pickups", to: "/estate/pickups", icon: Truck },
      ],
    },
    {
      label: "Billing",
      items: [
        { label: "Payments", to: "/estate/payments", icon: CreditCard },
        { label: "Invoices", to: "/estate/invoices", icon: FileText },
      ],
    },
    {
      label: "Quality",
      items: [
        { label: "Complaints", to: "/estate/complaints", icon: MessageSquareWarning, badge: 3 },
        { label: "Reports", to: "/estate/reports", icon: BarChart3 },
        { label: "Settings", to: "/estate/settings", icon: Settings },
      ],
    },
  ],
  tabs: [
    { label: "Overview", to: "/estate/dashboard", icon: LayoutDashboard },
    { label: "Residents", to: "/estate/residents", icon: Users },
    { label: "Pickups", to: "/estate/pickups", icon: Truck },
    { label: "Billing", to: "/estate/payments", icon: CreditCard },
  ],
};

export const businessNav: PortalConfig = {
  key: "business",
  label: "Business",
  base: "/business",
  primaryAction: { label: "Request pickup", to: "/business/services" },
  groups: [
    {
      items: [
        { label: "Overview", to: "/business/dashboard", icon: LayoutDashboard },
        { label: "Locations", to: "/business/locations", icon: MapPin },
        { label: "Services", to: "/business/services", icon: Layers },
        { label: "Pickups", to: "/business/pickups", icon: Truck },
        { label: "Contracts", to: "/business/contracts", icon: FileSignature },
      ],
    },
    {
      label: "Finance",
      items: [
        { label: "Invoices", to: "/business/invoices", icon: FileText },
        { label: "Payments", to: "/business/payments", icon: CreditCard },
      ],
    },
    {
      label: "Manage",
      items: [
        { label: "Complaints", to: "/business/complaints", icon: MessageSquareWarning },
        { label: "Reports", to: "/business/reports", icon: BarChart3 },
        { label: "Team", to: "/business/team", icon: Users },
        { label: "Settings", to: "/business/settings", icon: Settings },
      ],
    },
  ],
  tabs: [
    { label: "Overview", to: "/business/dashboard", icon: LayoutDashboard },
    { label: "Locations", to: "/business/locations", icon: MapPin },
    { label: "Pickups", to: "/business/pickups", icon: Truck },
    { label: "Invoices", to: "/business/invoices", icon: FileText },
  ],
};

export const institutionNav: PortalConfig = {
  key: "institution",
  label: "Institution",
  base: "/institution",
  groups: [
    {
      items: [
        { label: "Overview", to: "/institution/dashboard", icon: LayoutDashboard },
        { label: "Facilities", to: "/institution/facilities", icon: Building2 },
        { label: "Departments", to: "/institution/departments", icon: Network },
        { label: "Services", to: "/institution/services", icon: Layers },
        { label: "Pickups", to: "/institution/pickups", icon: Truck },
      ],
    },
    {
      label: "Contracts & billing",
      items: [
        { label: "Contracts", to: "/institution/contracts", icon: FileSignature },
        { label: "Procurement", to: "/institution/procurement", icon: Briefcase },
        { label: "Billing", to: "/institution/billing", icon: CreditCard },
      ],
    },
    {
      label: "Governance",
      items: [
        { label: "Reports", to: "/institution/reports", icon: BarChart3 },
        { label: "Compliance", to: "/institution/compliance", icon: ShieldCheck },
        { label: "Team", to: "/institution/team", icon: Users },
        { label: "Settings", to: "/institution/settings", icon: Settings },
      ],
    },
  ],
  tabs: [
    { label: "Overview", to: "/institution/dashboard", icon: LayoutDashboard },
    { label: "Facilities", to: "/institution/facilities", icon: Building2 },
    { label: "Pickups", to: "/institution/pickups", icon: Truck },
    { label: "Billing", to: "/institution/billing", icon: CreditCard },
  ],
};

export const operatorNav: PortalConfig = {
  key: "operator",
  label: "Operator",
  base: "/operator",
  groups: [
    {
      items: [
        { label: "Today", to: "/operator/dashboard", icon: LayoutDashboard },
        { label: "Jobs", to: "/operator/jobs", icon: ClipboardList, badge: 14 },
        { label: "Routes", to: "/operator/routes", icon: Route },
        { label: "Calendar", to: "/operator/calendar", icon: CalendarDays },
        { label: "Customers", to: "/operator/customers", icon: Users },
      ],
    },
    {
      label: "Fleet",
      items: [
        { label: "Vehicles", to: "/operator/vehicles", icon: Car },
        { label: "Drivers", to: "/operator/drivers", icon: IdCard },
        { label: "Team", to: "/operator/team", icon: UserCog },
      ],
    },
    {
      label: "Business",
      items: [
        { label: "Contracts", to: "/operator/contracts", icon: FileSignature, badge: 1 },
        { label: "Payments", to: "/operator/payments", icon: Banknote },
        { label: "Invoices", to: "/operator/invoices", icon: FileText },
        { label: "Performance", to: "/operator/performance", icon: Gauge },
        { label: "Complaints", to: "/operator/complaints", icon: MessageSquareWarning },
        { label: "Reviews", to: "/operator/reviews", icon: Star },
      ],
    },
    {
      label: "Company",
      items: [
        { label: "Company profile", to: "/operator/company", icon: Building2 },
        { label: "Services", to: "/operator/services", icon: Layers },
        { label: "Service areas", to: "/operator/service-areas", icon: MapPin },
        { label: "Verification", to: "/operator/verification", icon: ShieldCheck },
        { label: "Documents", to: "/operator/documents", icon: FolderOpen },
        { label: "Settings", to: "/operator/settings", icon: Settings },
      ],
    },
  ],
  tabs: [
    { label: "Today", to: "/operator/dashboard", icon: LayoutDashboard },
    { label: "Jobs", to: "/operator/jobs", icon: ClipboardList },
    { label: "Routes", to: "/operator/routes", icon: Route },
    { label: "Payments", to: "/operator/payments", icon: Banknote },
  ],
};

export const adminNav: PortalConfig = {
  key: "admin",
  label: "Admin",
  base: "/admin",
  groups: [
    {
      items: [
        { label: "Control centre", to: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Pickups", to: "/admin/pickups", icon: Truck, badge: 12 },
        { label: "Bookings", to: "/admin/bookings", icon: CalendarClock },
        { label: "Routes", to: "/admin/routes", icon: Route },
      ],
    },
    {
      label: "People",
      items: [
        { label: "Customers", to: "/admin/customers", icon: Users },
        { label: "Operators", to: "/admin/operators", icon: Truck },
        { label: "Applications", to: "/admin/operator-applications", icon: Inbox, badge: 4 },
        { label: "Verification", to: "/admin/operator-verification", icon: ShieldCheck },
      ],
    },
    {
      label: "Commercial",
      items: [
        { label: "Contracts", to: "/admin/contracts", icon: FileSignature },
        { label: "Services", to: "/admin/services", icon: Layers },
        { label: "Service areas", to: "/admin/service-areas", icon: MapPin },
        { label: "Partnerships", to: "/admin/partnerships", icon: Handshake },
        { label: "Cities", to: "/admin/cities", icon: Globe2 },
        { label: "Expansion", to: "/admin/expansion", icon: Route },
      ],
    },
    {
      label: "Money",
      items: [
        { label: "Finance", to: "/admin/finance", icon: Landmark },
        { label: "Payments", to: "/admin/payments", icon: CreditCard, badge: 8 },
        { label: "Payouts", to: "/admin/payouts", icon: Banknote },
        { label: "Invoices", to: "/admin/invoices", icon: FileText },
        { label: "Chargebacks", to: "/admin/chargebacks", icon: RotateCcw, badge: 2 },
        { label: "Smart Sweep", to: "/admin/smart-sweep", icon: Coins },
      ],
    },
    {
      label: "Service quality",
      items: [
        { label: "Complaints", to: "/admin/complaints", icon: MessageSquareWarning },
        { label: "Support", to: "/admin/support", icon: LifeBuoy },
        { label: "Reviews", to: "/admin/reviews", icon: Star },
        { label: "Community", to: "/admin/community", icon: HeartHandshake },
        { label: "Recycling", to: "/admin/recycling", icon: Recycle },
      ],
    },
    {
      label: "Insight",
      items: [
        { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
        { label: "Reports", to: "/admin/reports", icon: ClipboardList },
        { label: "Notifications", to: "/admin/notifications", icon: Bell },
        { label: "Marketing", to: "/admin/marketing", icon: Megaphone },
      ],
    },
    {
      label: "Governance",
      items: [
        { label: "Compliance", to: "/admin/compliance", icon: Scale },
        { label: "Documents", to: "/admin/documents", icon: FolderOpen },
        { label: "Users", to: "/admin/users", icon: UserCog },
        { label: "Roles", to: "/admin/roles", icon: KeyRound },
        { label: "Audit log", to: "/admin/audit-log", icon: History },
        { label: "Settings", to: "/admin/settings", icon: Settings },
      ],
    },
  ],
  tabs: [
    { label: "Control", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Pickups", to: "/admin/pickups", icon: Truck },
    { label: "Operators", to: "/admin/operators", icon: Boxes },
    { label: "Complaints", to: "/admin/complaints", icon: MessageSquareWarning },
  ],
};

export const PORTALS = { app: customerNav, estate: estateNav, business: businessNav, institution: institutionNav, operator: operatorNav, admin: adminNav };
