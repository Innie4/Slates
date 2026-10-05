import { PickupStage, ServicePage, type ServicePageConfig } from "./_marketing";

const config: ServicePageConfig = {
  crumb: "Households",
  eyebrow: "Household waste · Slate Home",
  title: "Your bin, emptied on schedule.",
  body: "Twice-weekly collection for your home in a fixed two-hour window, by a verified operator managed by Slate. One monthly payment. If a pickup is ever missed, a crew is at your gate within 24 hours.",
  secondary: { label: "Check your address", to: "/#check" },
  aside: <PickupStage />,
  facts: [
    { label: "Slate Home", value: "₦7,000/month" },
    { label: "Collections", value: "Twice a week" },
    { label: "Pickup window", value: "2 hours" },
    { label: "Missed pickup", value: "Back in 24h" },
  ],
  included: {
    title: "Everything a household needs, and nothing to chase.",
    body: "Slate Home is built for the family in Ewet Housing Estate who just wants the bin gone on Monday and Thursday — without calling anyone.",
    items: [
      { title: "Two collections a week", body: "Fixed days for your street, such as Mon & Thu, in a window like 07:00–09:00. Need more? Choose three times weekly." },
      { title: "A 240-litre Slate bin", body: "Delivered before your first collection. Damaged by the crew? Slate replaces it." },
      { title: "Reminders that matter", body: "An SMS the evening before and when the truck is two stops away, plus a message the moment it's collected." },
      { title: "Missed-pickup recovery", body: "Report it with one tap. Slate recovers it within 24 hours, or credits that collection on your next bill." },
      { title: "Receipts and history", body: "Every payment and every pickup, timestamped, in your app. Download receipts for your landlord or office." },
      { title: "Extra and bulk pickups", body: "Party at the weekend? Book an extra pickup or a bulk collection from the app, on the same bill." },
    ],
  },
  steps: {
    title: "From sign-up to your first collection in under a week.",
    items: [
      { title: "Check your address", body: "Enter your street or estate. We'll show your collection days and window." },
      { title: "Choose a plan and pay", body: "Slate Home or Home Lite. Pay monthly, or split it with Smart Sweep." },
      { title: "Bin delivered", body: "Your Slate bin arrives within three working days, with your schedule." },
      { title: "Put it out by 7:00", body: "Bin at the gate on collection days. Slate handles everything else." },
    ],
  },
  plans: {
    title: "Two household plans. No call-out fees.",
    body: "Prices include collection, disposal and Slate's recovery promise. Prices are for Uyo; your exact days depend on your zone.",
    cards: [
      { serviceId: "svc-home-lite", prefix: "", cta: { label: "Choose Home Lite", to: "/signup" } },
      { serviceId: "svc-home-weekly", prefix: "", featured: true, cta: { label: "Choose Slate Home", to: "/signup" } },
      {
        name: "Add-ons",
        price: 1500,
        unit: "/month",
        prefix: "From",
        blurb: "Add to either plan from the app.",
        included: ["Recycling pickup, monthly — ₦1,500", "Extra pickup — ₦2,500 each", "Three collections a week — +₦3,000", "Bulk pickup — quoted from photos, from ₦15,000"],
        cta: { label: "See all pricing", to: "/pricing" },
      },
    ],
    note: "Prefer to pay in smaller amounts? Smart Sweep splits ₦7,000 into scheduled charges you choose — for example ₦1,750 every week. Slate never stores your card details; payments are tokenised by Paystack.",
  },
  faqs: [
    { q: "Which days will my waste be collected?", a: "It depends on your zone. Ewet Housing Estate and Shelter Afrique are Mon & Thu, Osongama is Tue & Fri, Oron Road is Wed & Sat. You'll see your days when you check your address." },
    { q: "What if I'm not home?", a: "You don't need to be. Put the bin at your gate by 07:00 on collection days. Add a landmark and gate note in the app so the crew can find it." },
    { q: "What can't go in my Slate bin?", a: "Construction debris, large furniture, appliances, hazardous chemicals and medical sharps. Book a bulk or special collection for those." },
    { q: "Can I pause while I travel?", a: "Yes. Pause from the app for up to 60 days a year; you aren't charged for paused weeks." },
    { q: "Is there a contract?", a: "No minimum term. Cancel any time before your next billing date and you won't be charged again." },
  ],
  related: [
    { label: "Recycling", to: "/services/recycling", body: "Sorted plastics, cans and paper, collected monthly for ₦1,500." },
    { label: "Bulk waste", to: "/services/bulk-waste", body: "Old furniture or moving out? Get a quote from photos." },
    { label: "Estates", to: "/services/estates", body: "Is your whole estate tired of chasing collectors? Bring Slate in." },
  ],
  cta: { title: "Your waste gets collected. We handle the rest.", body: "Check your address and start Slate Home today. Most homes have their first collection within five days." },
};

export default function ServiceHouseholds() {
  return <ServicePage c={config} />;
}
