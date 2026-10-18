/**
 * Slate journal, articles for /blog and /blog/:slug.
 * Plain data: the pages render blocks with Slate's type system.
 */

export type BlogCategory = "Estates" | "Households" | "Operators" | "Payments" | "Recycling" | "Company";

export const BLOG_CATEGORIES: BlogCategory[] = ["Estates", "Households", "Operators", "Payments", "Recycling", "Company"];

export type BlogBlock =
  /** Running paragraph */
  | { type: "p"; text: string }
  /** Sub-heading inside the article */
  | { type: "h2"; text: string }
  /** Pull quote, set large */
  | { type: "quote"; text: string; cite?: string }
  /** Bulleted or numbered list */
  | { type: "list"; items: string[]; ordered?: boolean }
  /** One big figure with a caption, e.g. { value: "96.8%", label: "of Uyo pickups on time in September" } */
  | { type: "stat"; value: string; label: string }
  /** Boxed aside with a title */
  | { type: "callout"; title: string; text: string };

export interface BlogAuthor {
  name: string;
  role: string;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  /** ISO date, e.g. "2026-09-22" */
  date: string;
  readMins: number;
  author: BlogAuthor;
  /** Seed for the strata header art (any integer 1–99). */
  seed: number;
  featured?: boolean;
  body: BlogBlock[];
}

export const AUTHORS = {
  ekemini: { name: "Ekemini Etuk", role: "Founder & CEO" },
  enobong: { name: "Enobong Ekanem", role: "Operations Lead" },
  nsikak: { name: "Nsikak Archibong", role: "Partnerships Manager" },
  abasiama: { name: "Abasiama Offiong", role: "Customer Success Lead" },
  ifiok: { name: "Ifiok Akpabio", role: "Finance & Admin" },
  chidinma: { name: "Chidinma Nwosu", role: "Technology Lead" },
} satisfies Record<string, BlogAuthor>;

export const ARTICLES: Article[] = [
  {
    slug: "why-estates-switch-to-managed-waste",
    title: "Why estates in Uyo are moving to one waste contract",
    excerpt: "Shelter Afrique Estate’s 312 homes went from cash collections and missed weeks to one contract, one bill and a monthly report.",
    category: "Estates",
    date: "2026-09-28",
    readMins: 4,
    author: AUTHORS.nsikak,
    seed: 14,
    featured: true,
    body: [
      {
        type: "p",
        text: "Until June, waste at Shelter Afrique Estate worked the way it works on most estates in Uyo. The residents’ association hired two collectors with an open truck, agreed a fee of ₦3,000 per house, and left the estate manager to sort out everything else. Everything else turned out to be most of the job.",
      },
      {
        type: "p",
        text: "Over the past six months we have signed estates in Ewet, Osongama and Shelter Afrique, and the reasons managers give for switching are remarkably consistent. None of them mention technology. They talk about cash, about trucks that did not come, and about phone calls on Sunday evenings.",
      },
      { type: "h2", text: "What the old arrangement actually cost" },
      {
        type: "p",
        text: "On paper, hiring collectors directly is cheap. In practice the cost is hidden in other people’s time. The pattern we hear about looks like this:",
      },
      {
        type: "list",
        items: [
          "Cash collected door to door. Someone has to walk the estate at the end of each month, chase the houses where nobody is in, and carry the money.",
          "Partial payment. In a good month, 60 to 70 percent of homes pay. The collectors expect the full amount, or quietly reduce service until the gap closes.",
          "Collectors who stop showing up. When fuel goes up, a truck breaks down or a better-paying job appears, Tuesday’s collection becomes Thursday’s, then next week’s.",
          "The manager as complaints desk. Every overflowing bin becomes a call to the estate office, which has no influence over the collectors and no record of what was promised.",
        ],
      },
      {
        type: "p",
        text: "None of this requires anyone to be dishonest. A two-person crew with one truck and cash customers cannot plan routes, and an estate office cannot run a waste company on the side.",
      },
      { type: "h2", text: "What changes with one contract" },
      {
        type: "p",
        text: "Under a Slate estate contract, the estate signs one agreement with us. We contract a verified operator for the route, collect payment from each resident through the app, and answer to the estate for the result. Pricing starts from ₦6,500 per household per month. That is more than ₦3,000, and we say so plainly in the first meeting. The difference pays for things the old fee never covered:",
      },
      {
        type: "list",
        items: [
          "One bill. Residents pay Slate by card, transfer or Smart Sweep. The estate office stops handling cash.",
          "A fixed schedule. Two collections a week, bins at the gate by 07:00, and a GPS check-in and photo at every stop.",
          "Missed pickups recovered within 24 hours, by a separate crew if the main operator cannot do it.",
          "A monthly estate report covering completion rate, missed and recovered pickups, complaints and how many homes are paid up.",
          "Operator replacement. If the operator falls below the standard in the contract, we move the route to another one. The estate does not have to find, vet or negotiate with anyone.",
        ],
      },
      {
        type: "p",
        text: "That last point matters more than managers expect. When the operator serving Osongama Estate fell to 79% completion in May, we suspended it and had another crew on the route the next morning. Residents saw a different truck, not a gap.",
      },
      { type: "h2", text: "Shelter Afrique Estate, three months in" },
      {
        type: "p",
        text: "Shelter Afrique Estate has 312 homes across five streets. The switch started in June with a meeting at the estate hall, where we took residents through the price and the schedule. Ufok Environmental Services, which already covers Ewet Housing Estate, took the route with two vehicles on Mondays and Thursdays.",
      },
      {
        type: "p",
        text: "The first fortnight was not smooth. Bin points on two streets were set too far back for the truck to reach, and we spent a week moving them before completion settled. By August, 291 of the 312 homes were paying through the app, and the estate office had stopped collecting cash entirely.",
      },
      {
        type: "quote",
        text: "I used to spend the last weekend of every month walking from house to house with a receipt book. Now I read one report on the first Monday and deal with the two or three things in it.",
        cite: "Uduak Essien, Estate Manager, Shelter Afrique Estate",
      },
      {
        type: "p",
        text: "The 21 homes not yet paying are still collected. The contract asks the estate to keep enrolment above 85%, and Slate carries the risk on individual late payers. Leaving one bin on a street to overflow punishes the neighbours, not the household that has not paid.",
      },
      { type: "h2", text: "What we ask of an estate" },
      {
        type: "p",
        text: "Managed waste is not the right fit for every estate. It works best where there is a functioning residents’ association, a road the truck can use in the rainy season, and a manager willing to share the first month’s complaints with us so we can fix bin points and schedules quickly. If your estate is in Uyo and that sounds like yours, our partnerships team will visit, walk the route and send a written quote within a week.",
      },
    ],
  },
  {
    slug: "uyo-first-why-we-started-here",
    title: "Why we started in Uyo",
    excerpt: "Why Uyo was the right place to test Slate, what six months of service taught us, and what has to be true before Port Harcourt.",
    category: "Company",
    date: "2026-09-21",
    readMins: 4,
    author: AUTHORS.ekemini,
    seed: 37,
    body: [
      {
        type: "p",
        text: "Slate went live in Uyo on 1 April 2026 with 182 customers. At the end of August we were serving 1,797 homes and sites. People ask why we did not start in Lagos, where the market is larger and the waste problem more visible. The honest answer is that we wanted to find out whether the model worked before we found out whether it scaled.",
      },
      {
        type: "p",
        text: "The model is simple to describe and hard to run. We do not own trucks. We verify and contract independent operators, sell one service to households, estates and businesses, and stand behind that service when an operator falls short. Every part of that depends on local conditions, so the first city had to make those conditions as favourable as possible.",
      },
      { type: "h2", text: "Why Uyo" },
      {
        type: "list",
        items: [
          "Size. Uyo is large enough to have real variety, from planned estates to market streets to industrial yards in Itam, and small enough that our operations team can reach any route in under 40 minutes.",
          "Estates. Ewet Housing Estate, Shelter Afrique Estate and Osongama Estate each have hundreds of homes, a residents’ association and one person who can sign a contract. That gave us density from the first month.",
          "Operators willing to contract. Most operators we met ran trucks half empty for part of the week and chased cash customers for the rest. A steady monthly payment against a clear standard was worth more to them than an uncertain cash round.",
          "State support. The Akwa Ibom State Environmental Protection and Waste Management Agency engaged early, confirmed how our model sits alongside public collection, and helped us check every operator permit we rely on.",
        ],
      },
      {
        type: "quote",
        text: "Before Slate, I knew how many trucks I had but not how much work they would do next month. Now I plan vehicles against a contract, and I get paid on the same day every month.",
        cite: "Aniekan Etim, Managing Director, Ufok Environmental Services",
      },
      {
        type: "p",
        text: "It also helps that most of the team is from here. We knew which roads flood in July and which estate gates close at 22:00.",
      },
      { type: "h2", text: "What six months taught us" },
      {
        type: "stat",
        value: "1,797",
        label: "homes and sites served in Uyo at the end of August, up from 182 in April",
      },
      {
        type: "p",
        text: "Operator supply, not demand, is the constraint. We approved about one in three operators who applied. Every time we added an estate, the question was not whether residents would sign up but whether we had a verified crew with capacity on that side of town.",
      },
      {
        type: "p",
        text: "Estates grow faster than single homes. One meeting at an estate hall can bring in 200 households; a street of individual homes takes weeks of conversations. Both matter, but estates gave us the route density that makes the economics work for operators.",
      },
      {
        type: "p",
        text: "Recovery needs its own crew. We promised that missed pickups would be recovered within 24 hours. The main operators could not reliably do that on top of their routes, so we contracted Nwaniba Clean Crew for overflow and emergencies. Without them, the promise would be a hope.",
      },
      {
        type: "p",
        text: "Payments fail on the 1st. Card declines cluster at the start of the month, before many salaries land. Rather than suspend service, we built Smart Sweep to recover balances in small capped charges.",
      },
      {
        type: "p",
        text: "Replacing an operator has to be routine. In June we terminated Obio Sanitation after its completion fell to 79%. Customers on its routes kept their collection days, which only worked because we had planned for it before it happened.",
      },
      { type: "h2", text: "What Port Harcourt needs first" },
      {
        type: "p",
        text: "Port Harcourt is scheduled for February 2027. That date depends on three things, and we will move it if any of them is not ready.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Operator supply. At least four verified operators covering residential, commercial and overflow routes, each through our full verification and a two-week trial. We have eleven applications and site visits under way.",
          "Regulatory approval. Our application to the Rivers State Waste Management Agency is submitted. We will not launch any route where an operator’s permit is still pending.",
          "Demand we can serve well. We would rather start with three estates and a set of commercial streets in one part of the city than take sign-ups everywhere and spread crews thin.",
        ],
      },
      {
        type: "callout",
        title: "After Port Harcourt",
        text: "Eket in the second quarter of 2027, Lagos in the third quarter, Abuja in the first quarter of 2028. Each date follows the same test: verified operators, approval in hand, and enough density to keep the standard. Uyo remains the city where we try changes first.",
      },
      {
        type: "p",
        text: "We would rather be late to a new city than unreliable in it. A bad first month in Port Harcourt would cost us the trust of customers there, and it would cost the attention of a team that still owes Uyo two collections a week at every gate.",
      },
    ],
  },
  {
    slug: "where-uyo-recyclables-go",
    title: "Where Uyo’s recyclables actually go",
    excerpt: "Every sorted load from Uyo is weighed. Where the PET, cans, paper and e-waste end up, what partners pay, and what we can’t recycle yet.",
    category: "Recycling",
    date: "2026-09-09",
    readMins: 4,
    author: AUTHORS.chidinma,
    seed: 52,
    body: [
      {
        type: "p",
        text: "Recycling pickup costs ₦1,500 a month on top of a Slate plan. Customers who pay it reasonably want to know that the bottles they rinse and the boxes they flatten do not end up in the same dumpsite as everything else. This is an account of where the material goes, written from the data side, because the data is how we know.",
      },
      {
        type: "p",
        text: "Since April, every sorted load collected in Uyo has been weighed at the partner’s gate before it is accepted. The partner’s weighbridge ticket, the driver’s GPS check-in and a photo of the load go into the same record. If the three do not match, the load is flagged and someone from operations calls the partner that day.",
      },
      { type: "h2", text: "The partners and what they take" },
      {
        type: "list",
        items: [
          "Itam Recovery Ltd takes PET bottles and HDPE containers at ₦180 per kg. 18,420 kg delivered since April.",
          "PaperLoop Uyo takes paper and cardboard at ₦60 per kg. 22,960 kg delivered since April, most of it cardboard from commercial customers on Aka Road and Oron Road.",
          "Ikot Metal Reclaim takes drinks cans and small scrap at ₦640 per kg. Volumes are low, because cans are light and many are picked up by informal collectors before they reach a bin.",
          "Ewet E-Cycle takes phones, chargers, small appliances and batteries. It pays by item type rather than by weight, and stores batteries under its own permit.",
          "Akwa Compost Works will take organic waste from markets and restaurants. The agreement is pending while it completes its site permit.",
        ],
      },
      {
        type: "p",
        text: "The money from partners goes back into the cost of the recycling route. It does not cover it. A recycling truck carries less weight per trip than a general waste truck, and ₦60 per kg for cardboard does not buy much diesel. The ₦1,500 monthly fee exists because the material alone does not fund the service.",
      },
      { type: "h2", text: "How a load becomes a report" },
      {
        type: "p",
        text: "Each month, customers on recycling pickup get a short recovery report in the app: how many kilograms their household or business set out, by material, and how that compares with the previous month. Estates and commercial customers get the same figures for the whole site.",
      },
      {
        type: "p",
        text: "The numbers start from the partner’s scale, not ours. Our drivers do not weigh at the kerb, and we would rather report a smaller, verified figure than an estimate. When a load is rejected for contamination, usually food in the paper or soft plastic in the PET bags, it is recorded as rejected and shown in the report.",
      },
      {
        type: "quote",
        text: "The weighbridge ticket is the only number I trust. If a load comes in light or mixed, I would rather Slate hears it from me the same day than reads it in a report at the end of the month.",
        cite: "Kufre Bassey, Yard Manager, Itam Recovery Ltd",
      },
      { type: "h2", text: "What we cannot recycle yet" },
      {
        type: "p",
        text: "Two kinds of material still go to general waste, and we would rather say so than imply otherwise.",
      },
      {
        type: "list",
        items: [
          "Mixed and soft plastics: sachet water bags, bread bags, food wrappers. No partner in the region takes them in volume at a price that covers collection. We are testing a baling arrangement but have nothing to announce.",
          "Glass. It is heavy, breaks in the truck and has no buyer within a practical distance of Uyo. We ask customers to wrap it and put it in general waste.",
        ],
      },
      {
        type: "p",
        text: "Organic waste will move to compost once Akwa Compost Works is ready. Until then, it is collected with general waste.",
      },
      { type: "h2", text: "The Ewet recycling stations" },
      {
        type: "p",
        text: "Not every household wants a separate pickup. In Ewet Housing Estate, residents funded six communal recycling stations through a community project that raised ₦1,260,000. Each station has separate bays for PET, cans and paper, and is emptied weekly by the recycling route. The first two went in during August; the other four follow in October.",
      },
      {
        type: "p",
        text: "Station loads are weighed and recorded the same way as household loads, so the estate can see what its stations recover each month. The first weeks suggest the stations collect cleaner PET than door-to-door bags, probably because the bays are labelled and in plain view. If that holds through the rainy season, we will propose the same model to other estates.",
      },
    ],
  },
  {
    slug: "what-happens-when-a-pickup-is-missed",
    title: "What happens when a pickup is missed",
    excerpt: "From the moment you report a missed pickup to the recovery truck, the operator penalty and your credit, step by step.",
    category: "Households",
    date: "2026-08-24",
    readMins: 4,
    author: AUTHORS.abasiama,
    seed: 8,
    body: [
      {
        type: "p",
        text: "Most weeks, a Slate pickup is unremarkable. The bin goes out by 07:00, the truck comes, the driver takes a photo, and you get a notification that says something like “Collected at 07:42”. This piece is about the weeks when that does not happen.",
      },
      {
        type: "p",
        text: "We promise that a missed pickup will be recovered within 24 hours. A promise like that is only worth something if the steps behind it are clear, so here they are, in the order they happen.",
      },
      { type: "h2", text: "Step by step" },
      {
        type: "list",
        ordered: true,
        items: [
          "You report it. Open the app, tap the collection that should have happened and choose “Not collected”. You can add a photo of the bin at the gate. Reports stay open until 12:00 the following day.",
          "We check the record. Every stop has a GPS check-in from the driver’s phone and a proof photo. We compare both with your report. If the truck never came within range of your address, the miss is confirmed straight away.",
          "We send a recovery crew. Confirmed misses go back to the operator first. If it cannot return the same day, the job goes to Nwaniba Clean Crew, our overflow and emergency operator. Either way, the 24-hour clock starts when you report.",
          "You see the outcome. When the bin is collected, you get the time and a new photo. If it is not collected within 24 hours, the app tells you that too, along with the credit you will receive.",
        ],
      },
      {
        type: "p",
        text: "Most recoveries happen well inside 24 hours. A miss reported at 09:00 on a Tuesday is usually collected by mid-afternoon.",
      },
      { type: "h2", text: "When the record and the report disagree" },
      {
        type: "p",
        text: "Sometimes the driver’s check-in and photo show the truck at your gate and no bin, or a bin that is already empty. In that case we do not simply close the report. Someone from customer success looks at both photos and calls you if anything is unclear. Gates locked at 06:30 and bins left inside the compound are the most common causes, and the fix is usually a note on the driver’s route sheet.",
      },
      { type: "p", text: "What counts as a missed pickup, and what does not:" },
      {
        type: "list",
        items: [
          "Counts: the truck did not come, or came and left without collecting a bin that was out and accessible.",
          "Counts: the crew took only part of the waste without a reason, such as hazardous items, recorded in the app.",
          "Does not count: the bin was not out, or the gate was locked, when the driver checked in.",
          "Does not count: the road was flooded or blocked and the operator logged it before the collection window. We reschedule for the next passable day and tell you in the app.",
        ],
      },
      { type: "h2", text: "What happens to the operator" },
      {
        type: "p",
        text: "Operators are paid per contract against a service standard. For every household pickup not recovered within 24 hours, the operator is charged ₦2,500 against its next payment. Completion rates and recovery times feed the score we review each month. An operator that falls below the standard in its contract is warned first, then suspended, and can lose the route.",
      },
      {
        type: "quote",
        text: "Drivers know the photo at each gate is what we are paid on. When a miss is reported I see it on my phone within minutes, and I would rather send a truck back than pay the penalty.",
        cite: "Itoro Akpan, Route Supervisor, Ufok Environmental Services",
      },
      {
        type: "p",
        text: "The penalty is deliberately larger than the value of one collection. It is meant to make going back the cheaper option for the operator, not to earn Slate money. Penalties go towards the overflow crew and customer credits.",
      },
      { type: "h2", text: "If we do not recover it in time" },
      {
        type: "callout",
        title: "Service credit",
        text: "If a confirmed missed pickup is not recovered within 24 hours, the value of that collection is credited to your next bill: ₦875 on Slate Home and ₦1,125 on Slate Home Lite. You do not need to ask for it.",
      },
      {
        type: "p",
        text: "A credit does not make up for a full bin in the heat, and we know that. It exists so that what we bill matches what we delivered. Across Uyo, a typical month sees a handful of these credits, and each one is reviewed with the operator responsible so the same street does not appear twice.",
      },
    ],
  },
  {
    slug: "smart-sweep-explained",
    title: "How Smart Sweep recovers a missed payment",
    excerpt: "When a card payment fails, Smart Sweep clears the balance in small capped charges you control, instead of stopping your collections.",
    category: "Payments",
    date: "2026-08-06",
    readMins: 4,
    author: AUTHORS.ifiok,
    seed: 71,
    body: [
      {
        type: "p",
        text: "Card payments fail. In Uyo, they fail most often on the 1st of the month, when renewals are due and many salaries have not yet arrived. Traders and artisans who are paid daily or weekly have money most weeks, just not always on the day a monthly charge runs.",
      },
      {
        type: "p",
        text: "The usual response from a subscription business is to retry the card a few times and then suspend service. For waste collection, that is a poor outcome for everyone. The bin fills, the street notices, and the customer has to find a lump sum to restart. Smart Sweep is how we avoid it.",
      },
      { type: "h2", text: "Why it exists" },
      {
        type: "stat",
        value: "1 in 9",
        label: "Slate renewals in June that failed on the first attempt, most for insufficient funds",
      },
      {
        type: "p",
        text: "Almost all of those customers paid within the month. The problem was timing, not willingness. A civil servant whose salary lands late in the month, or a stall holder on Aka Road whose best days are Friday and Saturday, cannot always hold ₦7,000 on a card on the 1st. Retrying the full amount every day just produces more declines and more bank alerts.",
      },
      { type: "h2", text: "How the capped charges work" },
      {
        type: "p",
        text: "When a failed payment leaves a balance, Smart Sweep offers to recover it in small automatic charges against your saved card. Each charge is capped. You choose the cap and the day of the week, within limits we set so the balance clears in a reasonable time.",
      },
      {
        type: "p",
        text: "A worked example. Edidiong is on Slate Home at ₦7,000 a month. Her card is declined on 1 June and again on 1 July, while a payment she is owed for a contract job is delayed. Her balance is ₦14,000. She sets Smart Sweep to ₦1,500 every Friday.",
      },
      {
        type: "list",
        items: [
          "Weeks 1 to 9: nine charges of ₦1,500, a total of ₦13,500.",
          "Week 10: one final charge of ₦500, and the balance is cleared.",
          "If a Friday charge fails, it is not retried that week. The next attempt is the following Friday, for the same capped amount.",
        ],
      },
      {
        type: "p",
        text: "Her collections continue throughout, twice a week, as normal. Her regular monthly bill is charged separately on the 1st. If she wants to clear the balance sooner, she can pay any amount at any time and Smart Sweep adjusts.",
      },
      { type: "h2", text: "The controls are yours" },
      {
        type: "list",
        items: [
          "Change the cap or the day at any time in the app.",
          "Pause Smart Sweep for up to 30 days, for example in a month with school fees.",
          "Pay the full balance by card or transfer and switch it off.",
          "See every charge, successful or not, with a receipt by SMS and email.",
        ],
      },
      {
        type: "p",
        text: "We do set limits. A balance has to keep moving. If nothing has been recovered for 60 days, someone from our customer team calls before anything else happens. Suspension is still possible, but it is the last step after a conversation, not the first step after a decline.",
      },
      {
        type: "quote",
        text: "Instead of a message saying my service had stopped, I got one saying ₦1,500 would come off on Friday. That, I can manage.",
        cite: "Mfon Ekpo, Slate Home customer, Ikot Ekpene Road",
      },
      {
        type: "callout",
        title: "How your card is stored",
        text: "Card details are entered on Paystack or Flutterwave, not on Slate’s servers. We hold a token, the last four digits and the expiry date. We never store your CVV. The token can only be charged by Slate, only up to the amounts you have agreed, and you can remove it in the app.",
      },
      {
        type: "p",
        text: "Smart Sweep costs us something. We carry the balance while it is recovered, and a small number of customers never clear it. We think that is a better trade than stopping a service over one failed payment, and so far the numbers agree.",
      },
    ],
  },
  {
    slug: "how-we-verify-waste-operators",
    title: "How we verify waste operators",
    excerpt: "Documents, permits, a yard visit and a two-week trial route. Why only about one in three operators who apply in Uyo are approved.",
    category: "Operators",
    date: "2026-07-16",
    readMins: 4,
    author: AUTHORS.enobong,
    seed: 26,
    body: [
      {
        type: "p",
        text: "Slate does not own trucks. Every collection a customer sees is carried out by an independent operator we have verified and contracted. That makes verification the most important thing we do. If we approve the wrong operator, the customer does not experience a bad supplier. They experience a bad Slate.",
      },
      {
        type: "p",
        text: "Before launch and in the months since, 14 operators have applied to work with us in Uyo. Five were approved. This is how we decide, and what happened when one of the five stopped meeting the standard.",
      },
      { type: "h2", text: "The checks, in order" },
      {
        type: "list",
        ordered: true,
        items: [
          "Company documents. Certificate of incorporation and status report from the Corporate Affairs Commission, a tax identification number and the names of the directors. We check them against the CAC register, not just the paper.",
          "State permit. A current permit from the Akwa Ibom State Environmental Protection and Waste Management Agency for the kind of waste the operator will carry. Industrial and institutional routes need the right category.",
          "Vehicle inspection. Every vehicle that will work a Slate route is inspected: brakes, tyres, lights, the tipping mechanism, and a cover so waste does not blow onto the road. Each vehicle that passes gets a Slate number.",
          "Drivers. A valid licence for the vehicle class, checked with the issuing authority, and a named loader for each crew.",
          "Insurance. Third-party motor insurance at minimum for every vehicle, and goods-in-transit cover for commercial routes.",
          "Yard visit. We visit where the vehicles are kept and maintained. We look at spare parts, how many vehicles actually run on the day, and where waste goes after collection.",
          "Trial route. Two weeks on a real route with real customers, with every stop recorded by GPS check-in and photo.",
        ],
      },
      {
        type: "p",
        text: "At the end of the trial, the operator is scored on completion, punctuality against the agreed window, photo quality, how complaints were handled and the condition of vehicles at spot checks. To be offered a contract, it needs at least 95% completion on the trial route and no unresolved safety issue.",
      },
      { type: "h2", text: "Why most applicants are not approved" },
      {
        type: "p",
        text: "Most operators who do not get through are not bad businesses. They fall short on one or two checks that matter for a contracted service.",
      },
      {
        type: "list",
        items: [
          "Fewer working vehicles than listed. Four trucks on paper, two running at the yard visit.",
          "Expired permits, or permits for the wrong category of waste.",
          "No insurance, or insurance on a vehicle that is not the one doing the work.",
          "Trial completion in the high 80s. Good enough for cash customers, not good enough for a 24-hour recovery promise.",
        ],
      },
      {
        type: "p",
        text: "We tell every operator which check it did not pass, and several have reapplied after fixing it. One of our current operators was turned down the first time for an expired permit.",
      },
      {
        type: "quote",
        text: "The yard visit is where you learn the most. Paperwork tells you what a company owns. The yard tells you what it can do tomorrow morning.",
        cite: "Utibe Okon, Operator Verification Officer, Slate",
      },
      { type: "h2", text: "When an approved operator falls short" },
      {
        type: "p",
        text: "Approval is not permanent. Each operator’s completion rate, recovery times and complaints are reviewed weekly and scored monthly. Contracts set a minimum, typically 95 to 97% completion depending on the route.",
      },
      {
        type: "p",
        text: "In May, Obio Sanitation, which served Osongama Estate, fell to 79% completion. Two of its vehicles were off the road and it had not told us. We issued a written warning in the second week of the month. Completion did not recover.",
      },
      {
        type: "p",
        text: "On 2 June we suspended Obio Sanitation from its routes. Nwaniba Clean Crew, our overflow operator, collected from Osongama the next morning on the usual schedule. Ufok Environmental Services, already running Ewet Housing Estate, took over the routes permanently on 16 June and added vehicles to do it. We terminated Obio’s contract the same week.",
      },
      {
        type: "p",
        text: "Residents did not lose a week of collections. Several told us they only noticed because the truck was a different colour. That is the reason we verify more than one operator for every kind of route: when one fails, a tested replacement is already on the road.",
      },
    ],
  },
];

export const articleBySlug = (slug: string | undefined) => ARTICLES.find((a) => a.slug === slug);
