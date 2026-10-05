import { Link } from "react-router";
import { LegalPage, LegalList, LegalNote, Term, type LegalSection } from "./_legal";

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    clauses: [
      <>
        These terms govern your use of slate.ng, the Slate apps for Android and iOS, and the customer, estate and operator portals (together, the{" "}
        <Term>“Platform”</Term>). The Platform is operated by Slate Technologies Ltd (RC 1904417), 22 Udo Udoma Avenue, Uyo, Akwa Ibom State (
        <Term>“Slate”</Term>, <Term>“we”</Term>, <Term>“us”</Term>).
      </>,
      "By creating an account or using the Platform, you agree to these terms. If you do not agree, do not use the Platform.",
      <>
        If you subscribe to a collection plan, our <Link to="/waste-service-terms">waste service terms</Link> also apply. If you are a contracted waste
        operator, our <Link to="/operator-terms">operator terms</Link> apply. Where those documents conflict with these terms on a matter of service or
        contract, those documents prevail.
      </>,
      <>
        Our <Link to="/privacy">privacy policy</Link> and <Link to="/cookies">cookie policy</Link> explain how we handle personal data. They form part of
        these terms.
      </>,
    ],
  },
  {
    id: "who-can-use",
    title: "Who can use Slate",
    clauses: [
      "You must be at least 18 years old and able to enter into a binding contract under Nigerian law to create an account.",
      "The Platform is intended for people and organisations in Nigeria. Collection service is available only in our current service areas, which are listed when you enter your address at sign-up. As of October 2026 that is Uyo, with Port Harcourt planned from February 2027.",
      "If you create an account on behalf of an estate, business or institution, you confirm that you are authorised to bind that organisation to these terms, and references to “you” include the organisation.",
    ],
  },
  {
    id: "accounts",
    title: "Your account and security",
    clauses: [
      "You must give accurate information when you create an account, and keep it up to date. This matters most for your address, landmark and phone number, because crews rely on them.",
      "You are responsible for keeping your password private and for activity on your account. Do not share your login with anyone outside your household or organisation.",
      "We strongly recommend turning on two-factor authentication in your account settings. It is required for estate manager, business admin and operator accounts.",
      <>
        Tell us straight away at <a href="mailto:hello@slate.ng">hello@slate.ng</a> or on WhatsApp at +234 700 752 8300 if you think someone has accessed
        your account without permission. We may lock the account while we investigate.
      </>,
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    clauses: [
      <>
        When using the Platform you must not:
        <LegalList
          items={[
            "give a false address, landmark or GPS pin, or book collections for an address you have no right to use;",
            "upload photos or content that is unlawful, abusive, sexually explicit, or that shows other people without their consent;",
            "harass, threaten or abuse Slate staff or operator crews, in person or online;",
            "try to access accounts, data or parts of the Platform you are not authorised to use;",
            "probe, scan or test the Platform for vulnerabilities without our written permission;",
            "use bots, scrapers or automated tools to access the Platform, other than standard search engine crawlers on public pages;",
            "interfere with the Platform’s operation, including by introducing malware or overloading our servers;",
            "use the Platform to arrange payments to operators outside Slate, or for any fraudulent purpose; or",
            "resell or sublicense access to the Platform.",
          ]}
        />
      </>,
      <>
        If you find a security vulnerability, report it to <a href="mailto:hello@slate.ng">hello@slate.ng</a> with the subject “Security”. We will not take
        action against good-faith reports that avoid harm to users and data.
      </>,
    ],
  },
  {
    id: "slates-role",
    title: "Slate’s role",
    clauses: [
      "Slate manages waste collection as a single service. We do not own collection trucks. We source, verify and contract independent waste operators in each city, assign them to routes, and monitor their work against service standards.",
      <>
        Operators are independent contractors, not Slate employees or agents. However, your contract for collection service is with Slate, not with the
        operator. Slate remains responsible to you for the service standard set out in the <Link to="/waste-service-terms">waste service terms</Link>,
        including recovery of missed pickups and service credits.
      </>,
      "You pay Slate, and only Slate. Operators and their crews are not allowed to ask you for payment, tips in exchange for service, or extra charges. If anyone does, please report it to us.",
    ],
    outro: (
      <LegalNote>
        If a pickup goes wrong, come to us, not the operator. We handle it, and we hold the operator to their contract.
      </LegalNote>
    ),
  },
  {
    id: "content-ip",
    title: "Content and intellectual property",
    clauses: [
      "The Platform, including its software, design, text, graphics, the Slate name and logo, is owned by or licensed to Slate and protected by Nigerian and international intellectual property law, including the Copyright Act 2022 and the Trade Marks Act.",
      "We give you a personal, non-exclusive, non-transferable, revocable licence to use the Platform for its intended purpose while these terms apply. You may not copy, modify, distribute, reverse engineer or create derivative works from it, except as the law allows.",
      <>
        You keep ownership of content you submit, such as photos of bulk waste, reviews and support messages (<Term>“Your Content”</Term>). You give Slate a
        non-exclusive, royalty-free licence to use, store and display Your Content to provide and improve the service, and, for reviews, to show them on the
        Platform.
      </>,
      "You confirm that you have the right to submit Your Content and that it does not infringe anyone else’s rights.",
    ],
  },
  {
    id: "community-projects",
    title: "Community projects",
    intro:
      "Community projects let residents pool money for shared work, such as clearing an illegal dumpsite, cleaning a drainage channel or placing communal bins on a street.",
    clauses: [
      "Each project has a stated scope, target amount, deadline and a named provider, which is a Slate-contracted operator or another provider verified by Slate. We review projects before they go live.",
      "Contributions are paid to Slate and held in a designated account. They are not released to the provider when you pay.",
      "When the target is reached, the provider carries out the work. Slate releases the funds to the provider only after the work has been verified, using before-and-after photos with GPS stamps and, where practical, a site check by Slate staff.",
      "If a project does not reach its target by the deadline, or is cancelled before work starts, every contributor is refunded in full to the original payment method within 10 working days. No fees are deducted from refunds.",
      "If verified work is only partly completed, Slate will release payment only for the completed part and refund the balance to contributors in proportion to what they paid.",
      "Slate charges the provider a service fee on funded projects, shown on the project page. Contributors do not pay a fee on top of their contribution.",
    ],
  },
  {
    id: "reviews",
    title: "Reviews and ratings",
    clauses: [
      "You can rate collections and leave reviews. Reviews must reflect your own genuine experience.",
      "We do not edit reviews to change their meaning, and we do not remove reviews because they are negative. We may remove reviews that break section 4, contain personal data about crews or other residents, or are unrelated to the service.",
      "Ratings are shared with operators in aggregate and used to measure their performance. Individual crew members are not shown your name.",
    ],
  },
  {
    id: "availability",
    title: "Availability of the Platform",
    clauses: [
      "We aim to keep the Platform available at all times, but we do not guarantee uninterrupted access. We may need to take it offline for maintenance, usually between 01:00 and 05:00 WAT, and we will give notice in the app for planned work longer than 30 minutes.",
      "If the app is unavailable, your scheduled collections continue as normal. You can report missed pickups or contact support by WhatsApp or phone on +234 700 752 8300.",
      "We may change, add or remove features of the Platform. If we remove a feature that is a material part of a service you pay for, we will tell you in advance.",
    ],
  },
  {
    id: "liability",
    title: "Our liability to you",
    clauses: [
      "Nothing in these terms limits or excludes our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for any liability that cannot be limited or excluded under Nigerian law, including your rights under the Federal Competition and Consumer Protection Act 2018 (FCCPA).",
      "Subject to clause 10.1, we are responsible for loss or damage you suffer that is a foreseeable result of our breach of these terms or our failure to use reasonable care and skill. We are not responsible for loss that was not foreseeable when you started using the Platform.",
      "Subject to clause 10.1, we are not liable for loss of profit, loss of business or business interruption where you use the Platform for business purposes.",
      "Subject to clause 10.1, our total liability to you arising from your use of the Platform in any 12-month period is limited to the greater of the fees you paid to Slate in that period and ₦100,000. Liability for collection service is dealt with in the waste service terms.",
      "We are not responsible for delays or failures caused by events outside our reasonable control, such as flooding, civil unrest, strikes, fuel scarcity, government restrictions or failure of national telecoms networks. We will tell you as soon as we can and work to limit the effect.",
    ],
  },
  {
    id: "indemnity",
    title: "Your indemnity",
    clauses: [
      "You agree to compensate Slate for reasonable losses, costs and expenses (including reasonable legal fees) arising from a third-party claim caused by your breach of these terms, your misuse of the Platform, or Your Content infringing someone else’s rights.",
      "This does not apply to the extent that the loss was caused by our own breach or negligence. We will tell you promptly about any claim and let you take part in its defence.",
    ],
  },
  {
    id: "suspension",
    title: "Suspension and termination",
    clauses: [
      "You can close your account at any time from account settings or by contacting support. Closing your account does not cancel amounts already owed. Cancellation of a collection plan is covered in the waste service terms.",
      <>
        We may suspend or close your account if:
        <LegalList
          items={[
            "you seriously or repeatedly break these terms;",
            "you abuse or threaten Slate staff or operator crews;",
            "we reasonably suspect fraud or unauthorised use; or",
            "we are required to by law or by a regulator.",
          ]}
        />
      </>,
      "Except where there is a risk of harm, fraud or a legal requirement to act immediately, we will give you notice and a chance to respond before closing your account. We will refund any prepaid amount for service we will no longer provide.",
      "Sections 6, 10, 11 and 13 continue to apply after your account is closed.",
    ],
  },
  {
    id: "law-disputes",
    title: "Governing law and disputes",
    clauses: [
      "These terms are governed by the laws of the Federal Republic of Nigeria.",
      <>
        If you have a complaint, contact support first through the app, at <a href="mailto:hello@slate.ng">hello@slate.ng</a> or on +234 700 752 8300. We
        aim to resolve complaints within 10 working days.
      </>,
      <>
        If a dispute is not resolved within 30 days of your complaint, either of us may refer it to mediation. If it is not resolved within 30 days of
        mediation starting, it will be finally resolved by arbitration under the Arbitration and Mediation Act 2023, before a sole arbitrator, seated in
        Uyo, Akwa Ibom State, in English. Write to <a href="mailto:legal@slate.ng">legal@slate.ng</a> to start either process.
      </>,
      "Nothing in this section prevents you from complaining to the Federal Competition and Consumer Protection Commission (FCCPC), the Nigeria Data Protection Commission, or any other regulator, or from bringing a claim in a small claims court where one is available.",
    ],
  },
  {
    id: "changes-contact",
    title: "Changes and contact",
    clauses: [
      "We may update these terms to reflect changes in the law, our service or how the Platform works. For material changes, we will notify you by email or in the app at least 30 days before they take effect. If you do not agree, you can close your account before then.",
      "If any part of these terms is found to be unenforceable, the rest continues to apply.",
      <>
        Questions about these terms: <a href="mailto:legal@slate.ng">legal@slate.ng</a>. Everything else: <a href="mailto:hello@slate.ng">hello@slate.ng</a>{" "}
        or the <Link to="/contact">contact page</Link>. Common questions are answered in the <Link to="/faq">FAQ</Link>.
      </>,
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      doc="terms"
      title="Terms of use"
      lede="The rules for using slate.ng and the Slate apps. If you subscribe to collections, the waste service terms apply as well."
      effective="1 April 2026"
      updated="14 September 2026"
      version="1.2"
      summary={[
        "You need to be 18 or over and in Nigeria to have an account. Keep your address and landmark accurate, because crews rely on them.",
        "Slate contracts independent operators to do collections, but your contract is with us. If a pickup goes wrong, we are responsible for putting it right.",
        "Pay Slate only. Crews are not allowed to charge you anything.",
        "Community project money is held by Slate and only released once the work is verified. If a project is not funded, you get a full refund.",
        "Disputes go to support first, then mediation, then arbitration in Uyo. You can always complain to the FCCPC.",
      ]}
      sections={sections}
    />
  );
}
