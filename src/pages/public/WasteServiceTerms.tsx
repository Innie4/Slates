import { Link } from "react-router";
import { LegalPage, LegalList, LegalTable, LegalNote, Term, type LegalSection } from "./_legal";

const sections: LegalSection[] = [
  {
    id: "definitions",
    title: "Definitions",
    intro: (
      <>
        These terms apply to every collection plan you buy from Slate Technologies Ltd (<Term>“Slate”</Term>, <Term>“we”</Term>). They sit alongside our{" "}
        <Link to="/terms">terms of use</Link>. In these terms:
      </>
    ),
    clauses: [
      <>
        <Term>“Customer”</Term> or <Term>“you”</Term> means the person, household, estate, business or institution that holds a Slate collection plan and is
        responsible for paying for it.
      </>,
      <>
        <Term>“Operator”</Term> means an independent waste company that Slate has verified and contracted to carry out collections in your area. Operators
        work for Slate. You do not have a contract with them.
      </>,
      <>
        <Term>“Collection day”</Term> means the day or days of the week shown in your app for your scheduled collection.
      </>,
      <>
        <Term>“Collection window”</Term> means 07:00 to 18:00 on a collection day, unless your plan or estate agreement sets a different window.
      </>,
      <>
        <Term>“Missed pickup”</Term> means a scheduled collection that did not happen within the collection window, where you met your obligations in
        section 3 and none of the exceptions in clause 5.6 apply.
      </>,
      <>
        <Term>“Service area”</Term> means the streets and estates where Slate currently provides collection. You can check an address on the{" "}
        <Link to="/signup">sign-up page</Link>. As of October 2026 the service area covers Uyo and parts of Uyo Local Government Area.
      </>,
    ],
  },
  {
    id: "plans",
    title: "Plans and prices",
    clauses: [
      <>
        Our standard plans are:
        <LegalTable
          columns={["Plan", "Price", "Frequency", "Includes"]}
          rows={[
            ["Slate Home", "₦7,000 a month", "Twice weekly", "One 120-litre Slate bin, missed-pickup recovery, app and WhatsApp support"],
            ["Slate Home Lite", "₦4,500 a month", "Weekly", "Use your own bin or bags, missed-pickup recovery, app and WhatsApp support"],
            ["Estate", "From ₦6,500 per household a month", "Agreed per estate, at least weekly", "Estate dashboard, monthly estate report, resident billing"],
            ["Commercial", "From ₦30,000 a month", "Agreed per site, up to daily", "Sized bins or skips, collection log for compliance records"],
            ["Bulk waste", "Quoted per job", "One-off", "Furniture, renovation debris, garden waste, event clean-up"],
          ]}
        />
      </>,
      "Prices include VAT where it applies. Current prices are always shown on the pricing page and in the app before you pay.",
      "Bulk waste is quoted from photos you upload in the app. We aim to send a quote within one working day. A quote is valid for 7 days and is fixed unless the waste on the day is materially different from the photos, in which case the crew will not load it until you have accepted a revised quote.",
      "Estate and commercial prices depend on the number of households or bins, access, distance and frequency. They are set out in a written order form or estate agreement, which prevails over these terms where they conflict.",
    ],
    outro: (
      <p>
        See <Link to="/pricing">pricing</Link> for current plans and <Link to="/how-it-works">how it works</Link> for what happens on a collection day.
      </p>
    ),
  },
  {
    id: "your-responsibilities",
    title: "What you need to do",
    clauses: [
      "Put your bin or bags at your gate, or at the collection point agreed for your estate, by 07:00 on your collection day. Crews may arrive at any time within the collection window.",
      "Make sure the bin is accessible: not behind a locked gate, not blocked by parked cars, and not placed where a crew would need to enter your compound, unless you have arranged that with us.",
      "Keep your address, landmark and GPS pin accurate in the app. If you move, or the landmark changes, update it before your next collection day.",
      "Close bin lids and tie bags. Waste left loose on the ground beside the bin will be collected only if it is bagged.",
      "Do not put prohibited waste in your bin (see section 4).",
      "Treat crews with respect. Slate may suspend service at an address where crews are threatened or abused.",
    ],
  },
  {
    id: "waste-types",
    title: "Accepted and prohibited waste",
    clauses: [
      "Household and commercial plans cover general waste: food waste, packaging, paper and cardboard, plastics, cans, glass, textiles, sweepings and small garden waste that fits in the bin.",
      <>
        The following waste is prohibited on all plans and will not be collected:
        <LegalList
          items={[
            "hazardous chemicals, including pesticides, solvents, paint thinners, acids and pool chemicals;",
            "medical sharps, needles and clinical waste, unless you hold an institutional medical waste contract with Slate;",
            "explosives, ammunition, fireworks and gas cylinders, including empty ones;",
            "asbestos and materials suspected to contain it;",
            "dead animals;",
            "liquid waste, including used engine oil, cooking oil in open containers, and septic or soak-away waste;",
            "car and inverter batteries;",
            "tyres;",
            "hot ashes and burning material; and",
            "anything else that a state environmental agency classifies as hazardous waste.",
          ]}
        />
      </>,
      "Electronic waste, fluorescent tubes and large quantities of construction debris are not collected as part of a regular plan. You can book them as bulk waste where we have a licensed route for them.",
      "If a crew finds prohibited waste, they will photograph it, leave it in place and record the visit as not collected. We will tell you in the app what was found and how to dispose of it safely.",
      "You are responsible for any injury, damage or regulatory penalty caused by prohibited waste you put out for collection.",
    ],
  },
  {
    id: "missed-pickups",
    title: "Missed pickups and recovery",
    clauses: [
      "If your collection is missed, report it in the app within 48 hours of the end of the collection window. You can also report it on WhatsApp at +234 700 752 8300.",
      "We verify reports using the operator’s GPS check-in and proof-of-service photo for your address. Most reports are verified within 2 hours during working hours.",
      "When a report is verified, we dispatch a recovery crew to collect within 24 hours of verification. You will get a message when the crew is on the way and when collection is complete.",
      <>
        If a verified missed pickup is not recovered within 24 hours, you receive a service credit on your next bill:
        <LegalList
          items={[
            "on twice-weekly plans, one-eighth of your monthly fee for each unrecovered collection (₦875 on Slate Home);",
            "on weekly plans, one-quarter of your monthly fee for each unrecovered collection (₦1,125 on Slate Home Lite); and",
            "on estate and commercial plans, the credit set out in your agreement, or one-eighth of the monthly fee for the affected address if none is set.",
          ]}
        />
      </>,
      "Credits are applied automatically. You do not need to claim them. If you cancel, unused credits are refunded with your final statement.",
      <>
        A collection does not count as missed if:
        <LegalList
          items={[
            "your bin or bags were not out at the gate by 07:00, shown by the crew’s photo and GPS check-in;",
            "access was blocked, for example by a locked estate gate, parked vehicles or a road closure on your street;",
            "the bin contained prohibited waste;",
            "the collection fell on a public holiday and we told you about the changed date at least 48 hours in advance; or",
            "collection was prevented by severe weather, flooding, civil unrest, a government-declared curfew or a similar event outside our control, and we notified you as soon as reasonably possible.",
          ]}
        />
      </>,
      "Where a collection is skipped for one of the reasons in clause 5.6 that is not your fault, we will collect on the next working day or at the next scheduled collection, whichever comes first.",
    ],
    outro: (
      <LegalNote>
        Report within 48 hours. We send a crew within 24 hours of checking your report. If we do not make it, you get money off your next bill without
        asking.
      </LegalNote>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    clauses: [
      "Plans are billed monthly in advance. Your billing date is the day you started your plan, or the 1st of the month for estate and commercial accounts unless your agreement says otherwise.",
      "You can pay by debit card, bank transfer or USSD. Payments are processed by Paystack or Flutterwave. If you save a card, the processor stores it and gives us a token. Slate never stores your full card number or CVV.",
      "If you save a card, you authorise us to charge it on each billing date for your plan fee, any bulk waste you have accepted, and any amounts due under these terms. We send a reminder 3 days before each charge.",
      "We send a receipt by email or in the app for every payment. Business and estate customers can download VAT invoices from their dashboard.",
      "We do not charge late fees or interest on overdue balances.",
    ],
  },
  {
    id: "failed-payments",
    title: "Failed payments and suspension",
    clauses: [
      "If a card payment fails, we retry it automatically on the billing date (day 0), on day 2 and on day 5. We tell you by SMS, email or WhatsApp after each failed attempt, and you can pay at any time by another method.",
      "You have a grace period of 7 days from the billing date. Collections continue as normal during the grace period.",
      "If the balance is still unpaid when the grace period ends, we will send you a written notice that service will be suspended in 48 hours unless you pay. A member of our team reviews every suspension before it takes effect.",
      <>
        <Term>Smart Sweep.</Term> Instead of paying the full balance at once, you can turn on Smart Sweep in the app. We then recover the outstanding
        balance in small automatic charges to your saved card or account, of no more than ₦1,500 each and no more than once every 2 days. Collections
        continue while Smart Sweep is active and recovering the balance. You can turn Smart Sweep off at any time, and no charge will be attempted after
        you do.
      </>,
      "If Smart Sweep has not cleared the balance within 30 days, the notice and suspension process in clause 7.3 applies.",
      "While your service is suspended, no collections take place and no new plan fees accrue. Your account, address and history are kept.",
      "When you clear the balance, we reinstate your collections within 48 hours of the payment being confirmed.",
    ],
  },
  {
    id: "changes-pause-cancel",
    title: "Price changes, pausing and cancellation",
    clauses: [
      "We will give you at least 30 days’ notice by email, SMS or in the app before any price increase. If you do not want to continue at the new price, you can cancel before it takes effect.",
      "You can pause your plan for up to 60 days in each calendar year, for example while you travel. Each pause must be at least 7 days and must be set at least 2 days before it starts. You are not charged for paused days. The credit is applied to your next bill.",
      "You can cancel at any time in the app or by contacting support. Cancellation takes effect at the end of the month you have already paid for, and collections continue until then.",
      "We do not refund the unused part of a month when you cancel, except where we have failed to deliver the service. In that case we refund in proportion to the collections we did not provide and did not recover.",
      "We may end your plan with 30 days’ notice, for example if we stop serving your area. We will refund any prepaid amount for the period after your service ends.",
    ],
  },
  {
    id: "bins",
    title: "Slate bins",
    clauses: [
      "Bins supplied with Slate Home, estate and commercial plans remain the property of Slate. They are numbered and linked to your address.",
      "Look after your bin and keep it at your address. Normal wear and tear, and damage caused by our crews, is repaired or replaced free.",
      "If your bin is lost, stolen or damaged beyond normal wear, we will replace it for a fee of ₦18,500 for a 120-litre bin, or the price in your agreement for larger bins. If a bin is stolen and you give us a police report, we waive the fee once in any 12-month period.",
      "When your plan ends, leave the bin out on your final collection day or arrange a collection with us within 14 days. If we cannot collect it, we may charge the replacement fee.",
    ],
  },
  {
    id: "estates-businesses",
    title: "Estates and businesses",
    clauses: [
      "An estate plan is agreed between Slate and the estate’s residents’ association, landlord or facility manager. The estate manager who signs the estate agreement confirms that they are authorised to do so on behalf of the association.",
      "Estates can choose to pay Slate in a single monthly invoice, or to have each household pay Slate directly through the app. Where residents pay directly, each resident is a Customer under these terms for their own household.",
      "Where residents pay directly, the estate manager can see which households are paid up, but not their payment details. Slate does not suspend collection for an individual household inside an estate in a way that leaves waste at a shared collection point.",
      "We send the estate manager a monthly estate report showing scheduled and completed collections, missed pickups and recovery times, and payment status.",
      "Commercial and institutional plans may include a collection log for environmental compliance records. Medical, industrial and hazardous waste are only collected under a separate written contract with a licensed operator.",
    ],
  },
  {
    id: "complaints",
    title: "Complaints and escalation",
    clauses: [
      <>
        Raise a complaint in the app, on WhatsApp at +234 700 752 8300, or at <a href="mailto:hello@slate.ng">hello@slate.ng</a>. Support is staffed from
        07:00 to 19:00, Monday to Saturday, excluding public holidays.
      </>,
      "We reply to every complaint within 4 working hours and aim to resolve it within 3 working days. If we need longer, we will tell you why and when to expect an answer.",
      "If you are not satisfied, ask for your complaint to be escalated to a support lead. They will respond within 2 working days.",
      <>
        If the support lead cannot resolve it, write to <a href="mailto:legal@slate.ng">legal@slate.ng</a>. A manager not involved in the original
        complaint will review it and send a final written response within 10 working days.
      </>,
      "You can complain to the Federal Competition and Consumer Protection Commission (FCCPC) at any time. Disputes not resolved through this process are handled as described in our terms of use.",
    ],
  },
  {
    id: "liability",
    title: "Liability",
    clauses: [
      "Slate is responsible to you for the collection service, even though collections are carried out by operators. We hold operators to their contracts separately.",
      "Nothing in these terms limits our liability for death or personal injury caused by negligence, for fraud, or for anything that cannot be limited under Nigerian law, including the Federal Competition and Consumer Protection Act 2018.",
      "If a crew damages your property, for example a gate, wall or vehicle, report it with photos within 7 days. We will investigate, and where the crew was at fault we will pay for the repair or a fair replacement value and recover the cost from the operator. You do not need to deal with the operator.",
      "Subject to clause 12.2, service credits are our main remedy for missed pickups. Our total liability for property damage in a single incident is limited to ₦500,000, and our total liability for all other loss in any 12-month period is limited to the plan fees you paid in that period.",
      "We are not liable for loss caused by your breach of these terms, including prohibited waste, inaccurate address details or blocked access.",
    ],
  },
  {
    id: "changes-contact",
    title: "Changes and contact",
    clauses: [
      "We may update these terms. For changes that affect your price, frequency, credits or rights, we will give at least 30 days’ notice. Other changes take effect when published.",
      <>
        Questions about your plan: <a href="mailto:hello@slate.ng">hello@slate.ng</a> or WhatsApp +234 700 752 8300. Questions about these terms:{" "}
        <a href="mailto:legal@slate.ng">legal@slate.ng</a>. You can also use the <Link to="/contact">contact page</Link> or read the{" "}
        <Link to="/faq">FAQ</Link>.
      </>,
    ],
  },
];

export default function WasteServiceTerms() {
  return (
    <LegalPage
      doc="waste-service-terms"
      title="Waste service terms"
      lede="What you get on a Slate collection plan, what we need from you, and what happens when a pickup is missed or a payment fails."
      effective="1 April 2026"
      updated="14 September 2026"
      version="1.3"
      summary={[
        "Put your bin at the gate by 07:00 on collection day. Crews come any time until 18:00.",
        "Report a missed pickup in the app within 48 hours. We send a crew within 24 hours of checking it, or credit your next bill.",
        "You are billed monthly in advance. If a payment fails, you have 7 days’ grace, and we give 48 hours’ notice before any suspension.",
        "You can pause for up to 60 days a year and cancel any time. Cancellation takes effect at the end of the month you paid for.",
        "No chemicals, sharps, batteries, dead animals or liquid waste in your bin.",
      ]}
      sections={sections}
    />
  );
}
