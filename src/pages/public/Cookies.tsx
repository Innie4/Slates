import { Link } from "react-router";
import { LegalPage, LegalList, LegalTable, LegalNote, Term, type LegalSection } from "./_legal";

const Name = ({ children }: { children: string }) => <code className="t-mono text-[13px] text-ink">{children}</code>;

const sections: LegalSection[] = [
  {
    id: "about",
    title: "About this policy",
    clauses: [
      "This policy explains the cookies and similar technologies used on slate.ng and in the Slate web portals by Slate Technologies Ltd (RC 1904417), 22 Udo Udoma Avenue, Uyo, Akwa Ibom State.",
      <>
        It should be read with our <Link to="/privacy">privacy policy</Link>, which explains how we handle personal data generally and your rights under
        the Nigeria Data Protection Act 2023.
      </>,
    ],
  },
  {
    id: "what-they-are",
    title: "What cookies and local storage are",
    clauses: [
      <>
        A <Term>cookie</Term> is a small text file that a website stores in your browser. It is sent back to the website on later visits, so the site can
        recognise your browser, for example to keep you signed in.
      </>,
      <>
        <Term>Local storage</Term> is a similar feature that lets a website keep small pieces of information in your browser. Unlike cookies, it is not
        sent to our servers with every request. We use it for settings such as your light or dark appearance.
      </>,
      <>
        <Term>First-party</Term> cookies are set by slate.ng. <Term>Third-party</Term> cookies are set by another company’s domain, such as our payment
        processors on the payment step.
      </>,
      "In this policy, “cookies” includes local storage and similar technologies unless we say otherwise.",
    ],
  },
  {
    id: "categories",
    title: "Categories we use",
    clauses: [
      <>
        <Term>Strictly necessary.</Term> Needed for the site to work: signing in, keeping your session secure, remembering your cookie choices, protecting
        against bots and taking payments. These do not need your consent, and you cannot switch them off in our settings.
      </>,
      <>
        <Term>Preferences.</Term> Remember choices you make, such as appearance. They are stored only in your browser.
      </>,
      <>
        <Term>Analytics.</Term> Help us understand how many people use the site and which pages work or cause problems. We set these only if you agree.
      </>,
      <>
        <Term>Marketing.</Term> Record which campaign or partner brought you to Slate, so we know which outreach works. We set these only if you agree.
      </>,
      "Slate does not use third-party advertising cookies, and we do not allow advertising networks to track you on slate.ng. As of October 2026 we have no plans to change this. If we do, we will update this policy and ask for your consent first.",
    ],
  },
  {
    id: "cookie-list",
    title: "The cookies we use",
    intro: "This is the full list of cookies and local storage items used on slate.ng today.",
    clauses: [
      <>
        <LegalTable
          columns={["Name", "Purpose", "Category", "Duration"]}
          rows={[
            [<Name>slate_session</Name>, "Keeps you signed in and links requests to your account. HTTP-only, so page scripts cannot read it.", "Strictly necessary", "Session, or 30 days if you choose “keep me signed in”"],
            [<Name>slate_csrf</Name>, "Protects forms against cross-site request forgery.", "Strictly necessary", "Session"],
            [<Name>slate_consent</Name>, "Stores your cookie choices so we do not ask on every visit.", "Strictly necessary", "12 months"],
            [<Name>slate-role</Name>, "Local storage. Remembers which portal to open after sign-in: customer, estate, business or operator.", "Strictly necessary", "Until you sign out"],
            [<Name>slate-theme</Name>, "Local storage. Remembers whether you chose light or dark appearance.", "Preferences", "Until you clear it"],
            [<Name>__cf_bm</Name>, "Set by Cloudflare to tell people apart from automated bots and protect sign-in and payment pages.", "Strictly necessary", "30 minutes"],
            [<Name>paystack_*</Name>, "Set by Paystack on the payment step to process your card, transfer or USSD payment and prevent fraud.", "Strictly necessary", "Session"],
            [<Name>flw_*</Name>, "Set by Flutterwave on the payment step when you pay through Flutterwave.", "Strictly necessary", "Session"],
            [<Name>_pk_id</Name>, "Self-hosted analytics. A random ID that lets us count returning visitors without identifying you.", "Analytics", "13 months"],
            [<Name>_pk_ses</Name>, "Self-hosted analytics. Groups page views into a single visit.", "Analytics", "30 minutes"],
            [<Name>slate_utm</Name>, "Records which campaign, flyer code or partner link brought you to Slate.", "Marketing", "30 days"],
          ]}
        />
      </>,
      "Names ending in * are a group of cookies with that prefix. The exact names are set by the processor and may change.",
    ],
  },
  {
    id: "third-parties",
    title: "Third-party cookies",
    clauses: [
      "Paystack and Flutterwave set cookies only on the payment step, when you add a card or make a payment. They use them to process the payment securely and to detect fraud, under their own privacy and cookie policies.",
      "Cloudflare sets a bot-protection cookie on pages that need extra protection, such as sign-in and payment pages. It does not identify you personally.",
      "No other third party sets cookies on slate.ng. We do not use social media pixels, embedded advertising or third-party chat widgets that set cookies.",
    ],
  },
  {
    id: "analytics",
    title: "How our analytics work",
    clauses: [
      "We use Matomo, an open-source analytics tool, hosted on our own servers. Analytics data is not shared with Matomo or any other company.",
      "We shorten IP addresses before they are stored, so they cannot identify your exact connection. We do not combine analytics data with your account details.",
      "We use analytics to answer questions like how many people complete sign-up, which pages load slowly on mobile networks, and where people stop when booking bulk waste.",
      "Analytics cookies are set only after you accept them. If you decline, we still count page loads in our server logs, without cookies, for security and capacity planning.",
    ],
    outro: (
      <LegalNote>
        We do not run ads and we do not let ad networks follow you on our site. The only optional cookies are our own analytics and a 30-day campaign tag,
        and both are off until you say yes.
      </LegalNote>
    ),
  },
  {
    id: "your-choices",
    title: "How to control cookies",
    clauses: [
      "When you first visit slate.ng, we ask whether you accept analytics and marketing cookies. Both are off until you choose. Declining does not affect how the site works.",
      "You can change your choice at any time using the “cookie preferences” link in the footer of every page. Your new choice applies straight away, and we delete analytics and marketing cookies if you withdraw consent.",
      <>
        You can also block or delete cookies in your browser settings:
        <LegalList
          items={[
            "Chrome: Settings, then Privacy and security, then Third-party cookies or Delete browsing data;",
            "Safari on iPhone: Settings, then Safari, then Advanced, then Website Data;",
            "Firefox: Settings, then Privacy & Security, then Cookies and Site Data;",
            "Opera and Opera Mini: Settings, then Privacy, then Clear browsing data.",
          ]}
        />
      </>,
      "If you block strictly necessary cookies, you will not be able to sign in or pay through the site. Clearing local storage will reset your appearance setting and sign you out of the portal.",
    ],
  },
  {
    id: "do-not-track",
    title: "Do Not Track and Global Privacy Control",
    clauses: [
      "If your browser sends a Global Privacy Control signal, we treat it as a refusal of analytics and marketing cookies, and we do not show you the consent banner.",
      "We also honour the older Do Not Track setting in the same way, although many browsers no longer send it.",
    ],
  },
  {
    id: "mobile-apps",
    title: "Mobile apps",
    clauses: [
      "The Slate apps for Android and iOS do not use browser cookies. They store your sign-in token and settings in the device’s secure storage, and use crash reporting to fix bugs.",
      "App analytics, where used, follow the same rules as this policy: off until you agree, and never used for advertising. You can change this in the app under Settings, then Privacy.",
    ],
  },
  {
    id: "changes-contact",
    title: "Changes and contact",
    clauses: [
      "We update this policy when we add, remove or change a cookie. The table in section 4 always reflects what the site uses today.",
      "If we add a new category of cookie, or a cookie that shares data with a new third party, we will ask for your consent again before setting it.",
      <>
        Questions about cookies: <a href="mailto:privacy@slate.ng">privacy@slate.ng</a>. Our Data Protection Officer can be reached at{" "}
        <a href="mailto:dpo@slate.ng">dpo@slate.ng</a>.
      </>,
    ],
  },
];

export default function Cookies() {
  return (
    <LegalPage
      doc="cookies"
      title="Cookie policy"
      lede="The small files and browser settings slate.ng uses, what each one does, and how to turn the optional ones off."
      effective="1 April 2026"
      updated="2 August 2026"
      version="1.1"
      summary={[
        "We use a small number of cookies to keep you signed in, keep the site secure and take payments. These are always on.",
        "Analytics and marketing cookies are off until you agree. Our analytics run on our own servers and are never shared.",
        "We do not use advertising cookies or social media pixels.",
        "Paystack and Flutterwave set cookies only on the payment step.",
        "Change your choice any time with the cookie preferences link in the footer.",
      ]}
      sections={sections}
      contactEmail="privacy@slate.ng"
    />
  );
}
