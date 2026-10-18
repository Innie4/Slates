import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Building, Building2, Home, Store, Truck } from "lucide-react";
import { Button, ChoiceCard } from "@/components/ui";
import { HOME_FOR_ROLE, useSession } from "@/lib/session";
import { formatNaira } from "@/lib/format";
import type { Role } from "@/data";
import { AuthHeading, SignupProgress, readDraft, wait } from "./_shared";

type Kind = Extract<Role, "household" | "estate" | "business" | "institution">;

const KINDS: Array<{ value: Kind; title: string; description: string; icon: ReactNode; meta: string }> = [
  { value: "household", title: "Household", description: "Scheduled collection from your gate, one monthly payment.", icon: <Home />, meta: `From ${formatNaira(4500)} a month` },
  { value: "estate", title: "Estate or property manager", description: "One contract and one report for every home you manage.", icon: <Building />, meta: `${formatNaira(6500)} per home a month` },
  { value: "business", title: "Business", description: "Restaurants, shops, offices and hotels, up to daily pickups.", icon: <Store />, meta: `From ${formatNaira(30000)} a month` },
  { value: "institution", title: "Institution", description: "Schools, hospitals and agencies, with compliance documents.", icon: <Building2 />, meta: "Priced by quote after a site survey" },
];

const FROM_SIGNUP: Record<string, Kind> = { Residential: "household", Business: "business", Institution: "institution" };

/** A7, Choose how you'll use Slate. */
export default function AccountType() {
  const navigate = useNavigate();
  const { signIn } = useSession();
  const [kind, setKind] = useState<Kind>(() => FROM_SIGNUP[readDraft().account] ?? "household");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setLoading(true);
    await wait(600);
    signIn(kind);
    navigate(kind === "household" ? "/app/onboarding" : HOME_FOR_ROLE[kind]);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <SignupProgress current={3} />
        <AuthHeading title="How will you use Slate?">This sets up the right plans, billing and reports. You can add other sites later.</AuthHeading>
      </div>

      <div role="radiogroup" aria-label="Account type" className="flex flex-col gap-2.5">
        {KINDS.map((k) => (
          <ChoiceCard
            key={k.value}
            selected={kind === k.value}
            onSelect={() => setKind(k.value)}
            title={k.title}
            description={
              <>
                {k.description}
                <span className="mt-1 block t-micro text-ink-3 tnum">{k.meta}</span>
              </>
            }
            icon={k.icon}
          />
        ))}
      </div>

      <Button size="lg" block loading={loading} trailing={<ArrowRight className="size-4" />} onClick={go}>
        {kind === "household" ? "Set up my address" : "Continue to my portal"}
      </Button>

      <div className="flex items-start gap-3 border-t border-line pt-6">
        <Truck className="mt-0.5 size-5 shrink-0 text-ink-3" strokeWidth={1.75} />
        <p className="t-small text-ink-2">
          Run a waste collection company? Operators are contracted by Slate through a separate application with document checks.{" "}
          <Link to="/operator/onboarding" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            Apply as an operator
          </Link>
        </p>
      </div>
    </div>
  );
}
