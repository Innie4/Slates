import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { cities } from "@/data";
import { ButtonLink } from "@/components/ui";
import { AddressChecker } from "./_marketing";
import { NotifyForm } from "./_info";
export default function CityDetail() {
 const {city:slug}=useParams();
 const city=cities.find(item=>item.id===slug);
 if(!city) return <div className="container-page py-16"><h1 className="t-display text-ink">City not found.</h1><p className="mt-6 max-w-xl text-[18px] leading-relaxed text-ink">Browse the city guide or contact Slate about your location.</p><div className="mt-8 flex flex-wrap gap-3"><ButtonLink to="/cities">All cities</ButtonLink><ButtonLink to="/contact" variant="secondary">Contact Slate</ButtonLink></div></div>;
 return <div className="container-page py-12 lg:py-20"><Link to="/cities" className="inline-flex min-h-11 items-center gap-2 font-medium text-ink"><ArrowLeft className="size-4" />All cities</Link><header className="mt-8"><h1 className="t-display-xl text-ink">{city.name}</h1><p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-ink">{city.id==='uyo'?"Find your area in the Uyo service guide. Your exact address, collection capacity and service terms are confirmed before service starts.":`Interested in waste collection in ${city.name}? Tell us your neighbourhood and the kind of property you need collection for. Launch dates and service availability are not confirmed.`}</p></header><section className="mt-12">{city.id==='uyo'?<AddressChecker inputId="city-address-check" />:<div className="grid gap-10 rounded-2xl bg-surface p-6 sm:p-10 lg:grid-cols-2 lg:gap-20"><div><h2 className="t-display text-ink">Add your interest.</h2><p className="mt-6 max-w-md text-[18px] leading-relaxed text-ink">The team can review demand by area. Your details are saved as an enquiry, with no payment or booking.</p></div><NotifyForm city={city} /></div>}</section></div>;
}
