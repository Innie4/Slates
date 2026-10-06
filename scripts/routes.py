"""Route manifest -> src/routes.tsx + stub pages (only creates stubs that don't exist)."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PUBLIC = [("", "Home", "Home"), ("how-it-works", "HowItWorks", "How it works"), ("services", "Services", "Services"),
  ("services/households", "ServiceHouseholds", "Households"), ("services/estates", "ServiceEstates", "Estates"),
  ("services/businesses", "ServiceBusinesses", "Businesses"), ("services/institutions", "ServiceInstitutions", "Institutions"),
  ("services/bulk-waste", "ServiceBulkWaste", "Bulk waste"), ("services/recycling", "ServiceRecycling", "Recycling"),
  ("for-estates", "ForEstates", "For estates"), ("for-businesses", "ForBusinesses", "For businesses"),
  ("for-institutions", "ForInstitutions", "For institutions"), ("for-waste-companies", "ForWasteCompanies", "For waste companies"),
  ("cities", "Cities", "Cities"), ("cities/:city", "CityDetail", "City"), ("about", "About", "About"), ("contact", "Contact", "Contact"),
  ("faq", "Faq", "FAQ"), ("blog", "Blog", "Blog"), ("blog/:slug", "BlogPost", "Article"), ("pricing", "Pricing", "Pricing"),
  ("privacy", "Privacy", "Privacy policy"), ("terms", "Terms", "Terms of use"), ("waste-service-terms", "WasteServiceTerms", "Waste service terms"),
  ("operator-terms", "OperatorTerms", "Operator terms"), ("cookies", "Cookies", "Cookie policy"), ("design-system", "DesignSystem", "Design system")]
AUTH = [("signup", "SignUp", "Create account"), ("login", "Login", "Sign in"), ("verify-email", "VerifyEmail", "Verify email"),
  ("verify-phone", "VerifyPhone", "Verify phone"), ("forgot-password", "ForgotPassword", "Forgot password"),
  ("reset-password", "ResetPassword", "Reset password"), ("account-type", "AccountType", "Account type"), ("two-factor", "TwoFactor", "Two-factor authentication")]
APP = [("dashboard", "Dashboard", "Home"), ("services", "Services", "Services"), ("services/:id", "ServiceDetail", "Service"), ("book", "Book", "Book a service"),
  ("subscriptions", "Subscriptions", "Subscriptions"), ("subscriptions/:id", "SubscriptionDetail", "Subscription"), ("pickups", "Pickups", "Pickups"),
  ("pickups/:id", "PickupDetail", "Pickup"), ("extra-pickup", "ExtraPickup", "Request extra pickup"), ("bulk-waste", "BulkWaste", "Bulk waste"),
  ("report-missed", "ReportMissed", "Report missed pickup"), ("payments", "Payments", "Payments"), ("payment-methods", "PaymentMethods", "Payment methods"),
  ("smart-sweep", "SmartSweep", "Smart Sweep"), ("receipts", "Receipts", "Receipts"), ("complaints", "Complaints", "Complaints"),
  ("complaints/:id", "ComplaintDetail", "Complaint"), ("community", "Community", "Community"), ("community/:id", "CommunityProject", "Community project"),
  ("recycling", "Recycling", "Recycling"), ("profile", "Profile", "Profile"), ("settings", "Settings", "Settings"),
  ("notifications", "Notifications", "Notifications"), ("support", "Support", "Support")]
ESTATE = [("dashboard", "Dashboard", "Overview"), ("properties", "Properties", "Properties"), ("residents", "Residents", "Residents"),
  ("services", "Services", "Estate service"), ("pickups", "Pickups", "Pickups"), ("payments", "Payments", "Payments"), ("invoices", "Invoices", "Invoices"),
  ("complaints", "Complaints", "Complaints"), ("reports", "Reports", "Reports"), ("settings", "Settings", "Settings")]
BUSINESS = [("dashboard", "Dashboard", "Overview"), ("locations", "Locations", "Locations"), ("services", "Services", "Services"), ("pickups", "Pickups", "Pickups"),
  ("contracts", "Contracts", "Contracts"), ("invoices", "Invoices", "Invoices"), ("payments", "Payments", "Payments"), ("complaints", "Complaints", "Complaints"),
  ("reports", "Reports", "Reports"), ("team", "Team", "Team"), ("settings", "Settings", "Settings")]
INSTITUTION = [("dashboard", "Dashboard", "Overview"), ("facilities", "Facilities", "Facilities"), ("departments", "Departments", "Departments"),
  ("services", "Services", "Services"), ("contracts", "Contracts", "Contracts"), ("procurement", "Procurement", "Procurement"), ("pickups", "Pickups", "Pickups"),
  ("billing", "Billing", "Billing"), ("reports", "Reports", "Reports"), ("compliance", "Compliance", "Compliance"), ("team", "Team", "Team"), ("settings", "Settings", "Settings")]
OPERATOR = [("dashboard", "Dashboard", "Today"), ("company", "Company", "Company profile"), ("verification", "Verification", "Verification"),
  ("services", "Services", "Services"), ("service-areas", "ServiceAreas", "Service areas"), ("contracts", "Contracts", "Contracts"),
  ("customers", "Customers", "Customers"), ("jobs", "Jobs", "Jobs"), ("jobs/:id", "JobDetail", "Job"), ("routes", "Routes", "Routes"),
  ("calendar", "Calendar", "Calendar"), ("vehicles", "Vehicles", "Vehicles"), ("drivers", "Drivers", "Drivers"), ("payments", "Payments", "Payments"),
  ("invoices", "Invoices", "Invoices"), ("performance", "Performance", "Performance"), ("complaints", "Complaints", "Complaints"),
  ("reviews", "Reviews", "Reviews"), ("documents", "Documents", "Documents"), ("team", "Team", "Team"), ("settings", "Settings", "Settings")]
ADMIN = [("dashboard", "Dashboard", "Control centre"), ("customers", "Customers", "Customers"), ("customers/:id", "CustomerDetail", "Customer"),
  ("operators", "Operators", "Operators"), ("operators/:id", "OperatorDetail", "Operator"), ("operator-applications", "OperatorApplications", "Operator applications"),
  ("operator-applications/:id", "ApplicationReview", "Application review"), ("operator-verification", "OperatorVerification", "Operator verification"),
  ("contracts", "Contracts", "Contracts"), ("contracts/new", "ContractNew", "New contract"), ("contracts/:id", "ContractDetail", "Contract"),
  ("service-areas", "ServiceAreas", "Service areas"), ("services", "Services", "Service catalog"), ("bookings", "Bookings", "Bookings"),
  ("pickups", "Pickups", "Pickup control centre"), ("pickups/:id", "PickupDetail", "Pickup"), ("routes", "Routes", "Routes"),
  ("payments", "Payments", "Payments"), ("payments/:id", "PaymentDetail", "Payment"), ("payouts", "Payouts", "Payouts"),
  ("chargebacks", "Chargebacks", "Chargebacks"), ("smart-sweep", "SmartSweep", "Smart Sweep"), ("invoices", "Invoices", "Invoices"),
  ("community", "Community", "Community projects"), ("recycling", "Recycling", "Recycling"), ("complaints", "Complaints", "Complaints"),
  ("support", "Support", "Support centre"), ("reviews", "Reviews", "Reviews"), ("notifications", "Notifications", "Notifications"),
  ("marketing", "Marketing", "Marketing"), ("reports", "Reports", "Reports"), ("analytics", "Analytics", "Analytics"), ("finance", "Finance", "Finance"),
  ("compliance", "Compliance", "Compliance centre"), ("documents", "Documents", "Documents"), ("users", "Users", "Users"), ("roles", "Roles", "Roles & permissions"),
  ("settings", "Settings", "System settings"), ("audit-log", "AuditLog", "Audit log"), ("cities", "Cities", "Cities"), ("cities/:id", "CityDetail", "City"),
  ("expansion", "Expansion", "Market expansion"), ("partnerships", "Partnerships", "Partnerships"), ("partnerships/:id", "PartnerDetail", "Partner")]
STANDALONE = [("app/onboarding", "app", "Onboarding", "Get started"), ("operator/onboarding", "operator", "Onboarding", "Operator application")]

GROUPS = [("public", PUBLIC), ("auth", AUTH), ("app", APP), ("estate", ESTATE), ("business", BUSINESS), ("institution", INSTITUTION), ("operator", OPERATOR), ("admin", ADMIN)]

STUB = '''import {{ Page, PageHeader, StateView }} from "@/components/ui";

export default function {name}() {{
  return (
    <Page>
      <PageHeader title="{title}" />
      <StateView state="loading" title="Being built" description="This page is part of the Slate build in progress." />
    </Page>
  );
}}
'''

def stub(area, name, title):
    d = os.path.join(ROOT, "src", "pages", area)
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, f"{name}.tsx")
    if not os.path.exists(p):
        open(p, "w").write(STUB.format(name=name, title=title))

def lazy(area, name):
    return f'lazy: () => import("./pages/{area}/{name}").then((m) => ({{ Component: m.default }}))'

lines = []
for area, items in GROUPS:
    for path, name, title in items:
        stub(area, name, title)
for path, area, name, title in STANDALONE:
    stub(area, name, title)

def children(area, items):
    out = []
    for path, name, title in items:
        if path == "":
            out.append(f'      {{ index: true, {lazy(area, name)}, handle: {{ title: "{title}" }} }},')
        else:
            out.append(f'      {{ path: "{path}", {lazy(area, name)}, handle: {{ title: "{title}" }} }},')
    return "\n".join(out)

def portal(base, cfg, area, items, extra=""):
    return f'''  {{
    path: "/{base}",
    element: <PortalLayout config={{{cfg}}}{extra} />,
    errorElement: <ErrorPage />,
    children: [
      {{ index: true, element: <Navigate to="/{base}/dashboard" replace /> }},
{children(area, items)}
    ],
  }},'''

src = f'''/* AUTO-GENERATED by scripts/routes.py — edit the manifest there, then run `python3 scripts/routes.py`. */
import {{ createBrowserRouter, Navigate }} from "react-router";
import {{ RootLayout }} from "@/components/layout/RootLayout";
import {{ PublicLayout }} from "@/components/layout/PublicLayout";
import {{ AuthLayout }} from "@/components/layout/AuthLayout";
import {{ PortalLayout }} from "@/components/layout/PortalLayout";
import {{ AdminCommandBar }} from "@/components/layout/AdminCommandBar";
import {{ customerNav, estateNav, businessNav, institutionNav, operatorNav, adminNav }} from "@/components/layout/nav";
import ErrorPage from "@/pages/system/ErrorPage";

export const router = createBrowserRouter([
  {{
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <div className="min-h-dvh bg-canvas" aria-label="Loading Slate" />,
    children: [
  {{
    element: <PublicLayout />,
    errorElement: <ErrorPage />,
    children: [
{children("public", PUBLIC)}
    ],
  }},
  {{
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
{children("auth", AUTH)}
    ],
  }},
  {{ path: "/app/onboarding", {lazy("app", "Onboarding")}, handle: {{ title: "Get started" }} }},
  {{ path: "/operator/onboarding", {lazy("operator", "Onboarding")}, handle: {{ title: "Operator application" }} }},
{portal("app", "customerNav", "app", APP)}
{portal("estate", "estateNav", "estate", ESTATE)}
{portal("business", "businessNav", "business", BUSINESS)}
{portal("institution", "institutionNav", "institution", INSTITUTION)}
{portal("operator", "operatorNav", "operator", OPERATOR)}
{portal("admin", "adminNav", "admin", ADMIN, " banner={<AdminCommandBar />}")}
  {{ path: "*", lazy: () => import("./pages/system/NotFound").then((m) => ({{ Component: m.default }})), handle: {{ title: "Not found" }} }},
    ],
  }},
]);

/** Every routable path, used by the sitemap and screenshot scripts. */
export const ALL_PATHS: string[] = [
{chr(10).join(f'  "/{p}",' for g, items in GROUPS for p in [ (f"{g}/" if g not in ("public","auth") else "") + path for path,_,_ in items ])}
  "/app/onboarding",
  "/operator/onboarding",
];
'''
open(os.path.join(ROOT, "src", "routes.tsx"), "w").write(src)
total = sum(len(i) for _, i in GROUPS) + len(STANDALONE)
print("routes:", total)
