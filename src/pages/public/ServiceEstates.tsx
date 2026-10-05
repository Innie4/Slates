import { EstateStage, ServicePage, type ServicePageConfig } from "./_marketing";

const config: ServicePageConfig = {
  crumb: "Estates",
  eyebrow: "Estate waste management",
  title: "One agreement for every home in the estate.",
  body: "Slate collects from every household, collects every resident's payment and sends the estate one report a month. One waste-management partner for your entire estate.",
  primary: { label: "Talk to our estates team", to: "/for-estates" },
  secondary: { label: "See pricing", to: "/pricing" },
  aside: <EstateStage />,
  facts: [
    { label: "Per household", value: "₦6,500/month" },
    { label: "Collections", value: "2–3× a week" },
    { label: "Estate report", value: "Monthly" },
    { label: "Payment collection", value: "By Slate" },
  ],
  included: {
    title: "The estate gets a partner, not another collector to manage.",
    body: "Built with the managers of Shelter Afrique and Ewet Housing estates, who were spending more time chasing ₦2,000 dues than running their estates.",
    items: [
      { title: "Estate-wide schedule", body: "Every street on one plan — central collection points or door-to-door — at the same days and windows." },
      { title: "Resident payment collection", body: "Residents pay Slate directly by card, transfer or Smart Sweep. Slate follows up overdue households, not you." },
      { title: "Monthly estate report", body: "Pickups made, missed and recovered, payment status by household and every complaint, on the first of the month." },
      { title: "Complaint handling", body: "Residents report problems to Slate, not the estate office. You see every case and how it was resolved." },
      { title: "Operator replacement", body: "If the operator misses too often, Slate warns, penalises and replaces them. The estate doesn't renegotiate anything." },
      { title: "Community projects", body: "Raise funds for drainage clearing or recycling stations, held by Slate and released to a verified crew." },
    ],
  },
  steps: {
    title: "From the first meeting to estate-wide collection.",
    items: [
      { title: "Walk-through", body: "We visit with the estate manager or association, map collection points and count households." },
      { title: "Estate agreement", body: "A single agreement with the association, approved at your next meeting." },
      { title: "Resident onboarding", body: "Slate signs residents up door-to-door and online, and delivers bins." },
      { title: "Go live", body: "Collection starts across the estate. Your first report arrives the next month." },
    ],
  },
  plans: {
    title: "₦6,000 collection plus ₦500 management, per household.",
    body: "One agreement can bring 500 households onto Slate. Residents pay their own share; the estate isn't billed for homes that don't pay.",
    cards: [
      {
        serviceId: "svc-estate",
        name: "Estate Waste Management",
        price: 6500,
        unit: "/household/month",
        prefix: "",
        featured: true,
        breakdown: [
          ["Collection by the zone operator", "₦6,000"],
          ["Slate management — payments, reports, support", "₦500"],
        ],
        cta: { label: "Talk to our estates team", to: "/for-estates" },
      },
      {
        name: "Example: Shelter Afrique Estate",
        price: 2_028_000,
        unit: "/month",
        prefix: "",
        blurb: "312 homes, twice weekly, central collection points.",
        included: ["312 households × ₦6,500", "Collected by Ufok Environmental", "296 paid on time in September", "One report to the estate manager on the 1st"],
        cta: { label: "Read the estate case", to: "/for-estates" },
      },
    ],
    note: "Estates of 300+ homes can add a third weekly collection at ₦1,800 per household. Prices are for Uyo.",
  },
  faqs: [
    { q: "Does the estate have to pay for residents who don't?", a: "No. Residents pay Slate directly. Slate follows up overdue households, can pause their service, and reports payment status to you — the estate isn't billed for unpaid homes." },
    { q: "Can we keep our current collector?", a: "If they meet Slate's verification and sign Slate's SLA, yes — many estates bring their collector into the network. If not, the zone's contracted operator serves you." },
    { q: "How many households do we need?", a: "Estate agreements start at 50 households. Smaller streets can join as individual Slate Home customers." },
    { q: "What's in the monthly report?", a: "Pickups scheduled, completed, missed and recovered; payment status by household; complaints and resolution times; and recycling volumes if you have it." },
    { q: "How long is the agreement?", a: "Twelve months, renewable. The estate can exit with 60 days' notice if Slate misses the agreed service level two months running." },
  ],
  related: [
    { label: "For estate managers", to: "/for-estates", body: "The full picture for associations and managers." },
    { label: "Recycling", to: "/services/recycling", body: "Communal recycling stations, emptied monthly." },
    { label: "Households", to: "/services/households", body: "Individual homes outside an estate agreement." },
  ],
  cta: { title: "One waste-management partner for your entire estate.", body: "Book a walk-through. We'll count households, map collection points and send a written proposal.", primary: { label: "Book a walk-through", to: "/for-estates" } },
};

export default function ServiceEstates() {
  return <ServicePage c={config} />;
}
