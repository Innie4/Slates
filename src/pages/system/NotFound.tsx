import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Strata } from "@/components/brand/Strata";
import { ButtonLink } from "@/components/ui";

const SUGGESTIONS = [
  ["Report a missed pickup", "/app/report-missed"],
  ["See services and prices", "/pricing"],
  ["How Slate works", "/how-it-works"],
  ["Contact support", "/contact"],
] as const;

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col bg-canvas">
      <div className="container-page flex h-16 items-center">
        <Logo />
      </div>
      <div className="container-page grid flex-1 items-center gap-12 py-12 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <p className="t-mono text-ink-3">Error 404</p>
          <h1 className="t-display-xl text-ink">Nothing to collect here.</h1>
          <p className="t-body max-w-md text-ink-2">The page you're looking for has been moved or never existed. These might help.</p>
          <ul className="flex max-w-md flex-col divide-y divide-line border-y border-line">
            {SUGGESTIONS.map(([label, to]) => (
              <li key={to + label}>
                <Link to={to} className="flex items-center justify-between py-3.5 t-body font-medium text-ink hover:text-ink-2">
                  {label} <ArrowRight className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
          <div>
            <ButtonLink to="/">Back to home</ButtonLink>
          </div>
        </div>
        <div className="relative hidden aspect-square overflow-hidden rounded-xl bg-slate chalk-grain lg:block">
          <Strata tone="on-slate" bands={5} seed={404} className="absolute inset-0 h-full w-full" />
        </div>
      </div>
    </main>
  );
}
