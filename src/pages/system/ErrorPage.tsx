import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { Logo } from "@/components/brand/Logo";
import { Strata } from "@/components/brand/Strata";
import { ButtonLink, StateView } from "@/components/ui";

/** Route error boundary, 404s and unexpected errors. */
export default function ErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className="relative flex min-h-dvh flex-col bg-canvas">
      <div className="container-page flex h-16 items-center">
        <Logo />
      </div>
      <div className="flex flex-1 items-center justify-center px-5">
        <StateView
          state={notFound ? "not-found" : "error"}
          title={notFound ? "This page doesn't exist" : "Something broke on our side"}
          description={
            notFound
              ? "The link may be old or mistyped."
              : "Reload the page to try again. If it keeps happening, contact Slate and tell us which page you were opening."
          }
          action={
            <>
              <ButtonLink to="/">Back to home</ButtonLink>
              <button type="button" onClick={() => window.location.reload()} className="h-11 rounded-md px-4 text-[14px] font-medium text-ink-2 hover:bg-sunken">
                Reload
              </button>
            </>
          }
        />
      </div>
      <Strata tone="on-light" bands={3} chalk={false} seed={5} className="h-24 w-full opacity-40" />
      <p className="sr-only"><Link to="/">Home</Link></p>
    </div>
  );
}
