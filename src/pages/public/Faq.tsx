import { Link } from "react-router";
const QUESTIONS = [
  ["How do I start?", "Check your area, create an account and send a service request with your full address. Slate reviews the request before confirming a collection."],
  ["Where is collection available?", "The service guide covers Uyo. Street coverage and capacity vary, so an area match is a guide rather than a confirmed booking. Other city pages let you register your interest."],
  ["What do household plans cost?", "Home Lite starts at ₦4,500 a month for one collection a week. Slate Home starts at ₦7,000 for two. Estates, businesses and institutions receive a proposal for their site."],
  ["Can I pay on this website?", "Payments are not enabled here. Do not enter card or bank details into a contact form. Service terms and payment arrangements must be confirmed separately before any collection starts."],
  ["How do I report a missed pickup?", "Sign in and open your pickups or support page. Include the scheduled date and what happened. Your report is saved with a reference so the team can find it."],
  ["What can go in my household bin?", "Ordinary household waste should be bagged with the bin lid closed. Keep hazardous chemicals, sharps, batteries, building debris, electrical items and large furniture out. Ask the team about a separate collection."],
  ["How do bulk collections work?", "Send a list of items, approximate sizes and access details through the contact form. The team reviews the collection and provides a quote before you agree to it."],
  ["Can I change a request?", "Sign in to review your requests. If a change is not available on the request, contact support and include its reference. A request is not a confirmed collection until Slate has reviewed it."],
  ["How do I join as an operator?", "Use the operator enquiry page and describe your operating area, company and fleet. Any permits, disposal arrangements and partnership terms must be reviewed before work starts."],
];
export default function Faq() {
  return <div className="py-12 lg:py-24"><div className="container-page mb-12"><h1 className="t-display-xl text-ink">Good questions.</h1><p className="mt-6 max-w-xl text-[18px] leading-relaxed text-ink">What to expect when you request collection, choose a plan or ask for help.</p></div>{QUESTIONS.map(([q,a],index)=><section key={q} className={index%2===0?"bg-sunken":"bg-canvas"}><div className="container-page grid gap-5 py-8 lg:grid-cols-2 lg:gap-20"><h2 className="max-w-md text-[24px] font-semibold leading-tight text-ink">{q}</h2><p className="max-w-xl text-[17px] leading-relaxed text-ink">{a}</p></div></section>)}<div className="container-page mt-10"><Link to="/contact" className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4">Still need help? Contact Slate</Link></div></div>;
}
