import { useLocation } from "react-router";
import { ButtonLink } from "@/components/ui";
import { AuthHeading } from "./_shared";

export default function AccountHelp() {
  const { pathname } = useLocation();
  const reset = pathname.includes("password");
  return <div className="flex flex-col gap-6">
    <AuthHeading title={reset ? "Account help" : "Your Slate account"}>
      {reset ? "Password recovery is not available online yet. Contact the Slate team for account support." : "Email codes, phone verification and two-step sign-in are not enabled for this release."}
    </AuthHeading>
    <p className="t-body text-ink-2">Never share your password or a verification code with anyone. The team will explain the available next steps.</p>
    <ButtonLink to="/contact" block>Contact the Slate team</ButtonLink>
    <ButtonLink to="/login" block variant="secondary">Back to sign in</ButtonLink>
  </div>;
}
