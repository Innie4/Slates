import { Link } from "react-router";
import { LegalPage, LegalList, LegalTable, LegalNote, Term, type LegalSection } from "./_legal";

const sections: LegalSection[] = [
  {
    id: "definitions",
    title: "Definitions",
    intro: (
      <>
        These terms apply to every waste company contracted by Slate Technologies Ltd (<Term>“Slate”</Term>) to carry out collections. They form part of
        each Contract you sign with us. In these terms:
      </>
    ),
    clauses: [
      <>
        <Term>“Operator”</Term> or <Term>“you”</Term> means the waste company that has signed a Contract with Slate, including its directors, staff, drivers
        and crew.
      </>,
      <>
        <Term>“Contract”</Term> means the individual service contract between you and Slate, identified by a Contract ID such as CT-UYO-014, which sets out
        your zones, service types, capacity, rates, SLA targets and term.
      </>,
      <>
        <Term>“Customer”</Term> means a household, estate, business or institution that has a collection plan with Slate.
      </>,
      <>
        <Term>“Job”</Term> means a single scheduled collection, recovery visit or bulk waste collection assigned to you through the operator portal.
      </>,
      <>
        <Term>“Verified job”</Term> means a Job completed within its window and supported by a proof-of-service photo and GPS check-in that Slate has
        accepted.
      </>,
      <>
        <Term>“Completion rate”</Term> means verified jobs as a percentage of jobs assigned in a payout period, excluding jobs that could not be done for
        reasons recognised in our <Link to="/waste-service-terms">waste service terms</Link>, such as bins not put out or blocked access.
      </>,
      <>
        <Term>“SLA”</Term> means the service levels in section 4 and in your Contract.
      </>,
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility and verification",
    intro: "Before you receive any Jobs, we verify your company, vehicles and people. We repeat this every 12 months and whenever a document expires.",
    clauses: [
      <>
        You must provide and keep valid:
        <LegalList
          items={[
            "a Corporate Affairs Commission (CAC) certificate of incorporation or business name registration, and a Tax Identification Number;",
            "a current waste collection permit from the state environmental agency for each city you serve, such as the Akwa Ibom State Environmental Protection and Waste Management Agency (AKSEPWMA) in Uyo, or the relevant agency in other states;",
            "for each vehicle: registration papers, proof of ownership or a lease, a valid roadworthiness certificate and vehicle licence;",
            "for each driver: a valid driver’s licence of the right class and a National Identification Number (NIN);",
            "for each crew member: a NIN and a passport photograph;",
            "goods-in-transit insurance, third-party motor insurance and public liability insurance as described in section 11; and",
            "evidence of contributions under the Employees’ Compensation Act 2010 for your staff.",
          ]}
        />
      </>,
      "Every crew member on a Slate route must wear personal protective equipment: heavy-duty gloves, safety boots, a high-visibility vest and, where handling dusty or odorous waste, a face mask. You supply PPE at your cost.",
      "We inspect vehicles before they are approved and may carry out spot checks at any time. A vehicle that fails inspection may not be used on Slate routes until the fault is fixed.",
      "You must tell us within 2 working days if any permit, licence or insurance expires, is suspended or is withdrawn, or if a driver loses their licence.",
      "Verification documents are handled under our privacy policy and kept for the Contract term plus 6 years.",
    ],
    outro: (
      <p>
        Waste companies interested in working with Slate can start at <Link to="/for-waste-companies">for waste companies</Link>.
      </p>
    ),
  },
  {
    id: "the-contract",
    title: "The contract",
    clauses: [
      "Each Contract sets out your zones, the service types you will perform (household, estate, commercial, bulk), your committed capacity in Jobs per day, your rates per Job, your SLA targets and the term.",
      "Contracts usually run for 12 months and renew for further 12-month terms unless either party gives notice under section 13.",
      "Where a Contract conflicts with these terms, the Contract prevails for that Contract only.",
      "Slate assigns Jobs to you through the operator portal, normally by 18:00 the day before. We aim to keep your daily volume within 10% of your committed capacity. Where we need to assign more, you may decline the extra Jobs without penalty.",
      "You are an independent contractor. Nothing in these terms makes you an employee, agent or partner of Slate. You are responsible for your staff’s wages, taxes, pensions and statutory contributions.",
      "You may not subcontract Slate Jobs to another company without our written approval. Approved subcontractors must meet section 2, and you remain responsible for their work.",
    ],
  },
  {
    id: "service-standards",
    title: "Service standards",
    clauses: [
      "You must achieve the minimum monthly completion rate set in your Contract. This is usually between 95% and 97%, depending on the zone and service type.",
      "Each Job must be completed within its collection window. For household plans this is 07:00 to 18:00 on the collection day.",
      "At every stop, the crew must check in on the operator app, which records GPS location and time, and take a clear photo of the emptied bin at the gate. Where a Job cannot be done, the crew must photograph the reason, such as no bin out or a blocked gate.",
      "When Slate sends you a verified missed-pickup recovery, you must collect within the response time in your Contract, which is between 6 and 24 hours depending on the service type. Commercial and institutional recoveries usually have a 6-hour response time.",
      "All collected waste must be taken to an approved disposal site designated by the state environmental agency. Keep tip tickets or weighbridge receipts where the site issues them, and upload them when we ask.",
      "Vehicles must be loaded so that waste does not spill on the road, and must be covered or enclosed while moving.",
    ],
  },
  {
    id: "conduct",
    title: "Conduct and customer contact",
    clauses: [
      "Crews must wear Slate-approved uniform or tabards and carry the photo ID card issued through the operator portal on every Slate route.",
      "Crews must be polite to Customers, must not enter a Customer’s compound unless the Job notes say so, and must not smoke, drink alcohol or use drugs on duty.",
      <>
        You and your crews must not:
        <LegalList
          items={[
            "ask a Customer for any payment, tip or extra charge for a Slate Job;",
            "offer or agree to carry out work for a Slate Customer outside Slate, including bulk waste, for direct payment;",
            "collect waste that is prohibited under the waste service terms; or",
            "dump, burn or bury waste anywhere other than an approved disposal site.",
          ]}
        />
      </>,
      "If a Customer offers extra work or payment, the crew should decline and tell the Customer to book it in the Slate app.",
      "You must report any accident, injury, property damage or confrontation on a Slate route to Slate within 2 hours.",
    ],
    outro: (
      <LegalNote>
        Customers pay Slate, and Slate pays you. Taking money from a Customer directly, even once, ends the Contract.
      </LegalNote>
    ),
  },
  {
    id: "payouts",
    title: "Payouts",
    clauses: [
      "Slate pays you for each verified job at the rate in your Contract. Jobs without a valid proof-of-service photo and GPS check-in are not verified and are not paid, unless you show us other evidence that the Job was done within 5 working days.",
      "Payout periods are calendar months unless your Contract provides for bi-weekly payouts.",
      "Within 3 working days after the end of each period, we issue a payout statement in the operator portal showing every verified job, the rate, any penalties and deductions under section 7, withholding tax, and the net amount due.",
      "We pay the net amount by bank transfer to the Nigerian bank account registered in your company name, within 7 days after the end of a monthly period, or within 5 working days after the end of a bi-weekly period.",
      "We deduct withholding tax at the applicable rate and remit it to the relevant tax authority. We give you a receipt or credit note so you can claim it against your tax liability. If you are registered for VAT, your rates are exclusive of VAT and we pay VAT on your valid invoice.",
      "Bank details can only be changed by a written request signed by a director, confirmed by phone with Slate. Changes take effect from the next payout period.",
    ],
  },
  {
    id: "penalties",
    title: "Penalties and deductions",
    intro:
      "Penalties reflect the cost to Slate of putting things right for Customers, including recovery crews and service credits. Unless your Contract sets different amounts, the following apply.",
    clauses: [
      <>
        <LegalTable
          columns={["Breach", "Penalty"]}
          rows={[
            ["Missed household pickup not recovered within 24 hours", "₦2,500 per address"],
            ["Missed commercial or institutional pickup not recovered within the Contract response time", "₦7,500 per collection"],
            ["Monthly completion rate below the Contract SLA", "5% deduction from that month’s payout"],
            ["Monthly completion rate more than 5 percentage points below SLA", "10% deduction from that month’s payout"],
            ["Crew without PPE or ID on a verified spot check", "₦5,000 per crew per incident"],
            ["Waste disposed of other than at an approved site", "₦50,000 per incident, suspension, and report to the state agency"],
            ["Falsified proof of service, including reused photos or faked GPS", "Immediate suspension and recovery of payment for affected Jobs"],
            ["Charging a Customer directly or making a side deal", "Termination for cause"],
          ]}
        />
      </>,
      "Penalties are deducted from the payout for the period in which the breach occurred and itemised on your payout statement.",
      "Except for recovery of payment for falsified Jobs, total penalties in a single payout period will not exceed 25% of that period’s gross payout.",
      "No penalty applies where the breach was caused by Slate, by a Customer, or by an event outside your reasonable control, such as flooding, civil unrest or a government-declared curfew, if you told us promptly.",
    ],
  },
  {
    id: "deduction-disputes",
    title: "Disputing a deduction",
    clauses: [
      "If you disagree with a deduction or an unverified job, raise it in the operator portal within 14 days of the payout statement, with any supporting evidence such as photos, tip tickets or route logs.",
      "Slate will review the dispute and give a written decision within 10 working days. If we uphold your dispute, the amount is added to your next payout.",
      "Deductions not disputed within 14 days are treated as accepted, unless you could not reasonably have known about the error in that time.",
      "If you are not satisfied with our decision, either party may refer it to the dispute process in section 14.",
    ],
  },
  {
    id: "customer-data",
    title: "Customer data and confidentiality",
    clauses: [
      "You will receive Customer names, addresses, landmarks, GPS pins and access notes. Phone numbers are masked where the operator app supports it. You process this data on Slate’s behalf and only to perform Slate Jobs.",
      "You must comply with the Nigeria Data Protection Act 2023, keep Customer data secure, limit access to staff who need it for the day’s route, and not copy, export or store it outside the operator app.",
      "You must not contact Customers for any purpose other than completing a Job, and must not use Customer data for marketing or for any other business.",
      "You must tell Slate within 24 hours if you become aware of any loss or misuse of Customer data, so Slate can meet its 72-hour reporting obligation to the Nigeria Data Protection Commission.",
      "Each party will keep confidential the other’s non-public information, including rates, Customer lists, route data, payout statements and business plans, during the Contract and for 3 years after it ends. This does not apply to information that is public, or that must be disclosed by law or to a regulator.",
    ],
  },
  {
    id: "non-solicitation",
    title: "Non-solicitation",
    clauses: [
      "During the Contract and for 12 months after it ends, you must not, directly or through anyone else, solicit or accept waste collection work from any Customer you served through Slate, or encourage a Customer to leave Slate.",
      "During the same period, neither party will solicit the other’s managers or supervisors to leave their employment, except through general job advertisements.",
      "This section does not stop you serving a household or business that was already your direct client before it was assigned to you through Slate, if you can show this from your records.",
    ],
  },
  {
    id: "insurance-indemnity",
    title: "Insurance and indemnity",
    clauses: [
      <>
        Throughout the Contract you must hold, with an insurer licensed by the National Insurance Commission (NAICOM):
        <LegalList
          items={[
            "third-party motor insurance for every vehicle, as required by law, and comprehensive cover where your Contract requires it;",
            "goods-in-transit insurance covering waste being carried;",
            "public liability insurance of at least ₦10,000,000 per incident; and",
            "employer’s liability cover or compliance with the Employees’ Compensation Act 2010.",
          ]}
        />
      </>,
      "You must give us copies of your policies on request and tell us at least 14 days before any policy lapses or is cancelled.",
      "You will indemnify Slate against claims, losses, fines and reasonable costs arising from your negligence, your breach of these terms or the Contract, damage caused by your vehicles or crews, environmental offences, or claims by your staff.",
      "Slate will indemnify you against claims arising from Slate’s negligence or breach of the Contract.",
      "Neither party is liable to the other for loss of profit or indirect loss. Nothing limits liability for death or personal injury caused by negligence, or for fraud.",
    ],
  },
  {
    id: "suspension",
    title: "Suspension",
    clauses: [
      <>
        Slate may suspend some or all of your routes, with immediate effect, if:
        <LegalList
          items={[
            "a safety incident occurs on a Slate route involving serious injury or a vehicle that is not roadworthy;",
            "a required permit, licence, roadworthiness certificate or insurance policy has expired or been withdrawn;",
            "your completion rate is below 85% for two months in a row;",
            "we find falsified proof of service; or",
            "we reasonably suspect fraud, illegal dumping or a serious breach of the data protection obligations in section 9.",
          ]}
        />
      </>,
      "We will tell you the reason in writing on the day of suspension and what you need to do to have it lifted. Where the cause is an expired document, suspension ends when we receive a valid replacement.",
      "During suspension, we may reassign your Jobs to another operator. You are paid for verified jobs completed before suspension.",
      "If a suspension lasts more than 30 days, either party may terminate the Contract for cause.",
    ],
  },
  {
    id: "termination",
    title: "Termination and handover",
    clauses: [
      "Either party may end a Contract for convenience by giving 60 days’ written notice.",
      <>
        Either party may end a Contract for cause immediately by written notice if the other:
        <LegalList
          items={[
            "commits a material breach and does not remedy it within 14 days of being asked to;",
            "becomes insolvent, enters liquidation or receivership, or stops trading; or",
            "in your case, charges a Customer directly, makes a side deal, falsifies proof of service or loses a permit required to operate.",
          ]}
        />
      </>,
      "Customers must not be left without collection. During a notice period, you must continue to perform all Jobs to the SLA. If a Contract ends for cause, you must, if Slate asks, continue to serve your routes for up to 14 days at the Contract rate while Slate transfers them.",
      "On termination you must return any Slate bins, devices, ID cards and branded uniforms within 7 days, delete all Customer data from your systems and devices, and confirm the deletion in writing.",
      "Slate will pay all amounts due for verified jobs up to the end date, less valid deductions, on the normal payout timetable.",
      "Sections 7 to 11 and 14 continue to apply after the Contract ends.",
    ],
  },
  {
    id: "law-disputes",
    title: "Governing law, disputes and changes",
    clauses: [
      "These terms and every Contract are governed by the laws of the Federal Republic of Nigeria.",
      "If a dispute arises, the parties’ senior representatives will meet within 14 days to try to resolve it. If it is not resolved within 30 days of that meeting, either party may refer it to mediation.",
      "If mediation does not resolve the dispute within 30 days, it will be finally resolved by arbitration under the Arbitration and Mediation Act 2023, before a sole arbitrator, seated in Uyo, Akwa Ibom State, in English. Either party may seek urgent interim relief from a court.",
      "Slate may update these terms by giving you 30 days’ written notice. Changes to your rates, SLA targets or penalties only apply to an existing Contract if you agree to them in writing.",
      <>
        Operator questions: <a href="mailto:operators@slate.ng">operators@slate.ng</a> or +234 700 752 8300. Legal notices: Slate Technologies Ltd, 22 Udo
        Udoma Avenue, Uyo, Akwa Ibom State, copied to <a href="mailto:legal@slate.ng">legal@slate.ng</a>.
      </>,
    ],
  },
];

export default function OperatorTerms() {
  return (
    <LegalPage
      doc="operator-terms"
      title="Operator terms"
      lede="The terms for waste companies contracted by Slate: verification, service standards, payouts, penalties and how a contract ends."
      effective="1 March 2026"
      updated="14 September 2026"
      version="2.0"
      summary={[
        "We verify your CAC registration, state agency permit, vehicles, drivers and insurance before you get any Jobs, and check them again every 12 months.",
        "Every stop needs a GPS check-in and a photo. Verified jobs are paid at your contract rate within 7 days of the month ending.",
        "Hit your contracted completion rate, usually 95% to 97%. Missed pickups not recovered in time are deducted from your payout, and you have 14 days to dispute a deduction.",
        "Never take money from a Slate Customer directly. It ends the contract.",
        "Either side can end a contract with 60 days’ notice. Customers must keep getting collections during a handover.",
      ]}
      sections={sections}
      contactEmail="operators@slate.ng"
    />
  );
}
