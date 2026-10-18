import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { ARTICLES } from "./_articles";
export default function Blog() {
  return <div className="container-page py-12 lg:py-24"><h1 className="t-display-xl text-ink">Collection notes.</h1><p className="mt-6 max-w-xl text-[18px] leading-relaxed text-ink">Practical guides for your bin, your site and the things that need a separate pickup.</p><div className="mt-12 flex flex-col gap-5">{ARTICLES.map(article=><article key={article.slug} className="rounded-2xl bg-surface p-7 sm:p-10"><Link to={`/blog/${article.slug}`} className="group grid gap-5 lg:grid-cols-2 lg:gap-16"><h2 className="text-[30px] font-semibold leading-tight text-ink group-hover:underline group-hover:underline-offset-8">{article.title}</h2><div><p className="text-[18px] leading-relaxed text-ink">{article.summary}</p><span className="mt-5 inline-flex min-h-11 items-center gap-3 text-[15px] font-medium text-ink">{article.reading}<ArrowRight className="size-4" /></span></div></Link></article>)}</div></div>;
}
