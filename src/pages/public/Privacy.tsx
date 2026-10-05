import { Link } from "react-router";
import { LegalPage, LegalList, LegalTable, LegalNote, Term, type LegalSection } from "./_legal";

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    intro:
      "This policy explains how Slate Technologies Ltd collects, uses, shares and protects personal data when you use slate.ng, the Slate apps, our WhatsApp and phone support, or our waste collection service.",
    clauses: [
      <>
        <Term>“Slate”</Term>, <Term>“we”</Term> and <Term>“us”</Term> mean Slate Technologies Ltd, a company registered in Nigeria with RC 1904417, whose
        office is at 22 Udo Udoma Avenue, Uyo, Akwa Ibom State. <Term>“You”</Term> means the person whose data we process: a customer, an estate manager,
        a visitor to our website, or a person working for a contracted operator.
      </>,
      "Slate is the data controller for the personal data described in this policy. That means we decide why and how your data is processed, and we are responsible for it under the Nigeria Data Protection Act 2023 (NDPA).",
      <>
        Our Data Protection Officer can be reached at <a href="mailto:dpo@slate.ng">dpo@slate.ng</a>. General privacy questions go to{" "}
        <a href="mailto:privacy@slate.ng">privacy@slate.ng</a>.
      </>,
      <>
        Slate does not own collection trucks. We contract independent waste operators to carry out collections for us. When an operator handles your data to
        complete a pickup, it does so on our instructions and under a written contract, as described in section 5 and in our{" "}
        <Link to="/operator-terms">operator terms</Link>.
      </>,
    ],
  },
  {
    id: "data-we-collect",
    title: "Data we collect",
    intro: "We collect only what we need to run the service, bill for it and prove it was delivered.",
    clauses: [
      <>
        <Term>Account data.</Term> Your name, phone number, email address, password (stored as a one-way hash), the plan you choose, and for estates and
        businesses, your role and organisation name.
      </>,
      <>
        <Term>Location data.</Term> Your service address, the nearest landmark you give us (for example “opposite the Mobil filling station, after the
        second junction”), and a GPS pin you drop or confirm in the app. We use the pin so crews can find gates that are not easy to locate from a street
        address alone. We do not track your device location in the background.
      </>,
      <>
        <Term>Service history.</Term> Your collection days, completed and missed pickups, recovery visits, bulk waste requests, pauses, complaints and
        service credits.
      </>,
      <>
        <Term>Proof-of-service photos.</Term> Crews take a photo at each stop, with a time and GPS stamp, to show your bin was emptied or to show why it
        could not be (for example, the bin was not out). Crews are told to photograph the bin and gate, not people. If a photo shows you or a member of your
        household, you can ask us to delete it.
      </>,
      <>
        <Term>Payment metadata.</Term> The amount, date and status of each payment, the last four digits and expiry month of a saved card, the card type,
        the bank name for transfers, and the reference issued by our payment processor. We do not receive your full card number or CVV (see section 6).
      </>,
      <>
        <Term>Device and usage data.</Term> IP address, browser and app version, device model, operating system, pages and screens viewed, and crash
        reports. Our <Link to="/cookies">cookie policy</Link> explains the cookies and local storage we use.
      </>,
      <>
        <Term>Support records.</Term> Messages you send us in the app, by email or on WhatsApp, and recordings of calls to +234 700 752 8300. We tell you at
        the start of a call that it is recorded.
      </>,
      <>
        <Term>Operator and driver data.</Term> For people working for contracted operators: name, phone number, photo, National Identification Number
        (NIN), driver’s licence number and expiry, vehicle details, GPS check-ins during routes, and performance records. We collect NIN and licence details
        to verify identity and fitness to drive before anyone is allowed on a Slate route.
      </>,
      "Community projects. If you contribute to a community project, we record the project, the amount and whether you chose to show your name on the project page.",
    ],
  },
  {
    id: "lawful-bases",
    title: "Our lawful bases",
    intro:
      "The NDPA, the Nigeria Data Protection Regulation 2019 (NDPR) and the General Application and Implementation Directive 2025 (GAID) require us to have a lawful basis for each use of personal data. We rely on the following.",
    clauses: [
      <>
        <Term>Contract.</Term> Most processing is needed to provide the service you signed up for: scheduling collections, giving crews your address and
        landmark, taking payment, handling missed pickups and answering support requests.
      </>,
      <>
        <Term>Legal obligation.</Term> We keep payment and tax records to meet our obligations to the Federal Inland Revenue Service (FIRS) and the Akwa Ibom
        State Internal Revenue Service, respond to lawful requests from regulators and courts, and keep records required by state environmental agencies.
      </>,
      <>
        <Term>Legitimate interests.</Term> We use some data where we have a genuine business need that does not override your rights. Examples: proof-of-service
        photos to settle disputes and check operator performance, fraud prevention, network security, improving routes, and verifying operator staff. You
        can object to processing based on legitimate interests (see section 10).
      </>,
      <>
        <Term>Consent.</Term> We ask for your consent before sending marketing messages, setting analytics or marketing cookies, or publishing your name on a
        community project. You can withdraw consent at any time, and doing so does not affect processing that took place before you withdrew it.
      </>,
    ],
  },
  {
    id: "how-we-use",
    title: "How we use your data",
    clauses: [
      <>
        We use personal data to:
        <LegalList
          items={[
            "create and manage your account and verify your phone number;",
            "plan routes and assign your collections to a contracted operator;",
            "confirm that each collection happened, or record why it did not;",
            "bill you, retry failed payments and send receipts;",
            "respond to missed-pickup reports and dispatch recovery crews;",
            "answer questions and complaints on the app, email, phone and WhatsApp;",
            "send service messages, such as collection reminders, schedule changes for public holidays, and payment notices;",
            "measure operator performance against their contracts and calculate payouts and deductions;",
            "produce estate and business reports showing collection rates for your site;",
            "detect fraud, abuse and security incidents; and",
            "meet our legal, tax and regulatory obligations.",
          ]}
        />
      </>,
      "Service messages are part of the service and cannot be switched off while you have an active plan. Marketing messages are separate and you can opt out of them (see section 12).",
      "We do not make decisions about you based solely on automated processing that have legal or similarly significant effects. Payment retries and reminders are automated, but suspension of service is reviewed by a person before it takes effect.",
      "We do not sell personal data, and we do not share it with advertisers.",
    ],
  },
  {
    id: "sharing",
    title: "Who we share it with",
    intro: "We share personal data only with the parties below, and only what each one needs.",
    clauses: [
      <>
        <Term>Contracted operators.</Term> The operator assigned to your area receives your first name, address, landmark, GPS pin, collection day, plan and
        any access notes (for example, “gate code is with the security man”). Where the app supports it, your phone number is masked so crews call you
        through a relay number rather than seeing your real number. Operators may use this data only to complete Slate jobs and must delete it when their
        contract ends.
      </>,
      <>
        <Term>Payment processors.</Term> Paystack Payments Ltd and Flutterwave Technology Solutions Ltd process card, bank transfer and USSD payments on our
        behalf. They act as independent controllers for some payment data under their own privacy policies and the rules of the Central Bank of Nigeria.
      </>,
      <>
        <Term>Messaging providers.</Term> SMS gateways and the WhatsApp Business Platform (Meta) deliver service messages and support conversations. Call
        recording and relay numbers are provided by a telephony partner.
      </>,
      <>
        <Term>Cloud and software providers.</Term> Hosting, database, email delivery, error tracking and customer support tools that store or process data
        on our behalf under data processing agreements.
      </>,
      <>
        <Term>Estate managers and business account holders.</Term> If your collection is arranged through your estate or employer, the estate manager or
        account holder can see your address, payment status and collection history for that site. They cannot see your card details.
      </>,
      <>
        <Term>Regulators and law enforcement.</Term> The Nigeria Data Protection Commission (NDPC), FIRS, state environmental agencies, courts and the police,
        when we receive a lawful request or are required to by law. We check each request and disclose only what is required.
      </>,
      <>
        <Term>Professional advisers and successors.</Term> Lawyers, auditors and insurers, under confidentiality; and a buyer or investor in the event of a
        merger or sale of Slate, who must keep to this policy.
      </>,
    ],
  },
  {
    id: "payments",
    title: "Card and payment data",
    clauses: [
      "When you add a card, you enter the details on a page or form provided by Paystack or Flutterwave. The processor stores the card and gives us a token that lets us charge it for your plan. Slate never sees, receives or stores your full card number or CVV.",
      "Paystack and Flutterwave are certified to the Payment Card Industry Data Security Standard (PCI DSS) and are responsible for securing card data. We keep only the token, the last four digits, the card type and the expiry month, so you can recognise the card in your account.",
      "You can remove a saved card at any time in your account settings. Removing it deletes the token from our systems. We keep the payment records linked to past charges for the period shown in section 8.",
    ],
    outro: (
      <LegalNote>
        If someone contacts you claiming to be from Slate and asks for your card number, CVV, PIN or OTP, it is not us. We will never ask for these. Report it
        to <a href="mailto:hello@slate.ng">hello@slate.ng</a>.
      </LegalNote>
    ),
  },
  {
    id: "international-transfers",
    title: "International transfers",
    clauses: [
      "Some of our cloud hosting, email and support providers store data on servers outside Nigeria, including in the European Union, the United Kingdom and the United States.",
      "We transfer personal data outside Nigeria only where the NDPA allows it: where the destination has been recognised as providing adequate protection, or where we have put appropriate safeguards in place, such as standard contractual clauses or binding contractual terms that give your data protection equivalent to the NDPA.",
      <>
        You can ask for a copy of the safeguards we rely on by writing to <a href="mailto:dpo@slate.ng">dpo@slate.ng</a>.
      </>,
    ],
  },
  {
    id: "retention",
    title: "How long we keep it",
    intro: "We keep personal data only as long as we need it for the purpose it was collected for, or as long as the law requires.",
    clauses: [
      <>
        <LegalTable
          columns={["Data", "How long", "Why"]}
          rows={[
            ["Account and contact data", "While your account is active, then 2 years", "To handle late complaints, refunds and disputes after you leave"],
            ["Address, landmark and GPS pin", "While your account is active, then 2 years", "As above; deleted earlier on request if no dispute is open"],
            ["Payment and billing records", "6 years from the end of the financial year", "Tax and accounting obligations to FIRS and state revenue services"],
            ["Proof-of-service photos", "90 days", "To resolve missed-pickup reports and check operator work"],
            ["Support call recordings", "12 months", "Quality checks and complaint handling"],
            ["Support messages (app, email, WhatsApp)", "While your account is active, then 2 years", "To keep a record of what was agreed"],
            ["Operator and driver verification documents", "Contract term plus 6 years", "Evidence of checks for safety, insurance and legal claims"],
            ["Driver GPS check-ins", "13 months", "Payout calculation and SLA disputes"],
            ["Analytics data", "13 months", "Understanding how the site and apps are used"],
          ]}
        />
      </>,
      "If a dispute, claim or investigation is open, we may keep the relevant records until it is resolved.",
      "When the retention period ends, we delete the data or anonymise it so it can no longer identify you. Anonymised data, such as collection rates by area, may be kept for planning.",
    ],
  },
  {
    id: "security",
    title: "How we protect it",
    clauses: [
      "Data is encrypted in transit using TLS and encrypted at rest in our databases and backups.",
      "Staff and operator access is limited to what each role needs. Operator staff see only the stops on their current route, and access ends when the route is closed.",
      "Slate staff accounts require two-factor authentication. We log access to customer records and review those logs.",
      "We test our systems for vulnerabilities, train staff on data protection when they join and every year after, and require our processors to meet equivalent standards.",
      "No system is perfectly secure. If you think your account has been accessed without your permission, change your password and contact us straight away.",
    ],
  },
  {
    id: "your-rights",
    title: "Your rights",
    intro: "Under the NDPA you have the following rights over your personal data.",
    clauses: [
      <>
        <LegalList
          items={[
            <>
              <Term>Access</Term>: to get a copy of the personal data we hold about you.
            </>,
            <>
              <Term>Rectification</Term>: to have inaccurate or incomplete data corrected. You can update most account and address details yourself in the app.
            </>,
            <>
              <Term>Erasure</Term>: to have your data deleted where we no longer need it or you withdraw consent, subject to records we must keep by law.
            </>,
            <>
              <Term>Restriction</Term>: to ask us to stop using your data, except to store it, while a complaint about its accuracy or our use of it is
              resolved.
            </>,
            <>
              <Term>Portability</Term>: to receive data you gave us in a structured, machine-readable format, or have it sent to another provider.
            </>,
            <>
              <Term>Objection</Term>: to object to processing based on legitimate interests, and to object to direct marketing at any time.
            </>,
            <>
              <Term>Withdraw consent</Term>: where we rely on consent, at any time.
            </>,
          ]}
        />
      </>,
      <>
        To use any of these rights, write to <a href="mailto:privacy@slate.ng">privacy@slate.ng</a> or use the “Privacy requests” option in your account
        settings. We may ask you to confirm your identity, usually with a code sent to the phone number on your account.
      </>,
      "We respond within 30 days of receiving a verified request. If a request is complex, we may extend this by a further 30 days and will tell you why within the first 30 days. Requests are free unless they are clearly unfounded or excessive.",
      "If you are not satisfied with our response, you can complain to the Nigeria Data Protection Commission (NDPC) at ndpc.gov.ng. We would appreciate the chance to resolve your concern first.",
    ],
  },
  {
    id: "children",
    title: "Children",
    clauses: [
      "Slate accounts are for people aged 18 and over. We do not knowingly create accounts for, or collect personal data from, anyone under 18.",
      "Children may live at addresses we serve, and a crew photo may occasionally include a child. Crews are instructed not to photograph people, and we delete any such photo on request or when we find it during review.",
      "If you believe a child has created an account, contact privacy@slate.ng and we will close it and delete the data.",
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    clauses: [
      "We send marketing messages, such as news about new areas or plans, only if you have opted in. We do not send marketing on WhatsApp unless you have specifically agreed to it there.",
      "You can opt out at any time: use the unsubscribe link in any email, reply STOP to an SMS, change your preferences in account settings, or ask support. Opting out does not stop service messages about your collections and payments.",
      "We do not pass your contact details to other companies for their marketing.",
    ],
  },
  {
    id: "breaches",
    title: "Data breaches",
    clauses: [
      "If a personal data breach is likely to result in a risk to your rights and freedoms, we will notify the NDPC within 72 hours of becoming aware of it.",
      "If the breach is likely to result in a high risk to you, we will also tell you directly, in plain language, without undue delay. We will explain what happened, what data was involved, what we are doing about it and what you can do to protect yourself.",
      "We keep a record of all breaches, including those that do not need to be reported, and the steps taken in response.",
    ],
  },
  {
    id: "changes-contact",
    title: "Changes and contact",
    clauses: [
      "We review this policy at least once a year. If we make a material change, such as using your data for a new purpose or sharing it with a new type of recipient, we will tell you by email or in the app at least 30 days before it takes effect.",
      "The version number and “last updated” date at the top of this page show when it last changed.",
      <>
        Data Protection Officer: <a href="mailto:dpo@slate.ng">dpo@slate.ng</a>. Privacy questions: <a href="mailto:privacy@slate.ng">privacy@slate.ng</a>.
        Post: Data Protection Officer, Slate Technologies Ltd, 22 Udo Udoma Avenue, Uyo, Akwa Ibom State. You can also reach us through the{" "}
        <Link to="/contact">contact page</Link>.
      </>,
    ],
  },
];

export default function Privacy() {
  return (
    <LegalPage
      doc="privacy"
      title="Privacy policy"
      lede="What personal data Slate collects to run your waste collection, who we share it with, how long we keep it, and your rights under the Nigeria Data Protection Act 2023."
      effective="1 April 2026"
      updated="14 September 2026"
      version="1.2"
      summary={[
        "We collect what we need to collect your waste and bill you: your contact details, address, landmark and GPS pin, and a photo at each pickup as proof of service.",
        "Operators doing your pickup see your first name, address and landmark. Your phone number is masked where the app allows it.",
        "Paystack or Flutterwave handle your card. We never see or store your full card number or CVV.",
        "We do not sell your data. Pickup photos are deleted after 90 days and call recordings after 12 months.",
        "You can ask to see, correct or delete your data at privacy@slate.ng. We answer within 30 days, and you can complain to the NDPC.",
      ]}
      sections={sections}
      contactEmail="privacy@slate.ng"
    />
  );
}
