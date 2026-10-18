import { useEffect, useState } from "react";
import { Outlet, ScrollRestoration, useMatches } from "react-router";
import { WifiOff } from "lucide-react";

/** Root: document titles from route handles, scroll restoration, offline banner (Part L). */
export function RootLayout() {
  const matches = useMatches();
  const title = [...matches].reverse().find((m) => (m.handle as { title?: string } | undefined)?.title)?.handle as { title?: string } | undefined;
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    document.title = title?.title && title.title !== "Home" ? `${title.title} · Slate` : "Slate | Reliable waste collection";
  }, [title]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <>
      {!online && (
        <div role="status" className="fixed inset-x-0 top-0 z-[120] flex items-center justify-center gap-2 bg-slate-950 px-4 py-2 text-[13px] font-medium text-white">
          <WifiOff className="size-4" /> You're offline. Reconnect before sending a request.
        </div>
      )}
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
