import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { me, type Role } from "@/data";

/**
 * Frontend-only demo session. The signed-in role decides which portal
 * the user lands in. Persisted to localStorage (wrapped — storage can throw).
 */
interface Session {
  role: Role | null;
  signIn: (role: Role) => void;
  signOut: () => void;
  user: { name: string; role: string; email: string; org?: string };
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
}

const SessionContext = createContext<Session | null>(null);

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* storage unavailable */
  }
};

export const HOME_FOR_ROLE: Record<Role, string> = {
  household: "/app/dashboard",
  estate: "/estate/dashboard",
  business: "/business/dashboard",
  institution: "/institution/dashboard",
  operator: "/operator/dashboard",
  admin: "/admin/dashboard",
};

export function userForRole(role: Role | null): Session["user"] {
  switch (role) {
    case "estate":
      return { name: me.estate.name, role: me.estate.role, email: me.estate.email, org: me.estate.estate };
    case "business":
      return { name: me.business.name, role: me.business.role, email: me.business.email, org: me.business.business };
    case "institution":
      return { name: me.institution.name, role: me.institution.role, email: me.institution.email, org: me.institution.institution };
    case "operator":
      return { name: me.operator.name, role: me.operator.role, email: me.operator.email, org: "Ufok Environmental Services" };
    case "admin":
      return { name: me.admin.name, role: me.admin.role, email: me.admin.email, org: "Slate" };
    default:
      return { name: me.household.name, role: "Household", email: me.household.email, org: me.household.address };
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => (read("slate-role") as Role | null) ?? null);
  const [theme, setThemeState] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0E1318" : "#2B3643");
  }, [theme]);

  const signIn = useCallback((r: Role) => {
    setRole(r);
    write("slate-role", r);
  }, []);
  const signOut = useCallback(() => {
    setRole(null);
    write("slate-role", null);
  }, []);
  const setTheme = useCallback((t: "light" | "dark") => {
    setThemeState(t);
    write("slate-theme", t);
  }, []);

  return (
    <SessionContext.Provider value={{ role, signIn, signOut, user: userForRole(role), theme, setTheme }}>{children}</SessionContext.Provider>
  );
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
