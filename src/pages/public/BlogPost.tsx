import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { ARTICLES } from "./_articles";
export default function BlogPost() {
  const {slug} = useParams();
  const article = ARTICLES.find(item=>item.slug===slug);
  if (!article) return <div className="container-page py-20"><h1 className="t-display text-ink">Article not found.</h1><p className="mt-6 text-[18px] text-ink">Browse the collection guides to find what you need.</p><ButtonLink to="/blog" className="mt-8">All guides</ButtonLink></div>;
  return <article className="container-page py-12 lg:py-20"><Link to="/blog" className="inline-flex min-h-11 items-center gap-2 font-medium text-ink"><ArrowLeft className="size-4" />All guides</Link><header className="mt-8 max-w-3xl"><h1 className="font-display text-[clamp(2.6rem,5.8vw,5rem)] font-bold leading-none tracking-tight text-ink">{article.title}</h1><p className="mt-6 text-[20px] leading-relaxed text-ink">{article.summary}</p><p className="mt-5 text-[15px] text-ink-2">Slate collection guide · {article.reading}</p></header><div className="mt-14 flex max-w-2xl flex-col gap-12">{article.sections.map(section=><section key={section.title}><h2 className="text-[28px] font-semibold leading-tight text-ink">{section.title}</h2><p className="mt-5 text-[18px] leading-relaxed text-ink">{section.body}</p></section>)}</div><div className="mt-14 max-w-2xl rounded-2xl bg-sunken p-7"><h2 className="text-[24px] font-semibold text-ink">Ask about your collection.</h2><p className="mt-4 text-[17px] leading-relaxed text-ink">Your site may need a different arrangement. Share your location and service needs with the team.</p><ButtonLink to="/contact" className="mt-6">Contact Slate</ButtonLink></div></article>;
}
