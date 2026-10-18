import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { me, type Role } from "@/data";
import { api, messageFor } from "./api";
import type { SessionUser } from "../../server/contracts";

export const DEMO_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === "true";
const ROLES: Role[] = ["household", "estate", "business", "institution", "operator", "admin"];
type AccountUser = { name: string; role: string; email: string; org?: string };
interface Session {
  role: Role | null;
  mode: "account" | "demo" | null;
  account: SessionUser | null;
  ready: boolean;
  error: string;
  reload: () => Promise<void>;
  authenticate: (kind: "login" | "register", values: Record<string, string>) => Promise<void>;
  signIn: (role: Role) => void;
  signOut: () => Promise<void>;
  user: AccountUser;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}
const SessionContext = createContext<Session | null>(null);
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string | null) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* Storage is optional. */ } };
export const HOME_FOR_ROLE: Record<Role, string> = {
  household: "/app/dashboard", estate: "/estate/dashboard", business: "/business/dashboard",
  institution: "/institution/dashboard", operator: "/operator/dashboard", admin: "/admin/dashboard",
};
export function userForRole(role: Role | null): AccountUser {
  switch (role) {
    case "estate": return { name: me.estate.name, role: me.estate.role, email: me.estate.email, org: me.estate.estate };
    case "business": return { name: me.business.name, role: me.business.role, email: me.business.email, org: me.business.business };
    case "institution": return { name: me.institution.name, role: me.institution.role, email: me.institution.email, org: me.institution.institution };
    case "operator": return { name: me.operator.name, role: me.operator.role, email: me.operator.email, org: "Ufok Environmental Services" };
    case "admin": return { name: me.admin.name, role: me.admin.role, email: me.admin.email, org: "Slate" };
    default: return { name: me.household.name, role: "Household", email: me.household.email, org: me.household.address };
  }
}
export function SessionProvider({ children }: { children: ReactNode }) {
  const revision = useRef(0);
  const [account, setAccount] = useState<SessionUser | null>(null);
  const [demoRole, setDemoRole] = useState<Role | null>(() => {
    const stored = read("slate-preview-role");
    return DEMO_ENABLED && ROLES.includes(stored as Role) ? stored as Role : null;
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [theme, setThemeState] = useState<"light" | "dark">(() => document.documentElement.classList.contains("dark") ? "dark" : "light");
  const reload = useCallback(async () => {
    const current = ++revision.current;
    setError("");
    try {
      const result = await api<{ user: SessionUser | null }>("/session");
      if (current !== revision.current) return;
      setAccount(result.user);
      if (result.user) { setDemoRole(null); write("slate-preview-role", null); }
    } catch (cause) { if (current === revision.current) setError(messageFor(cause)); }
    finally { if (current === revision.current) setReady(true); }
  }, []);
  useEffect(() => {
    void reload();
    const refresh = () => { void reload(); };
    window.addEventListener("slate:session-check", refresh);
    window.addEventListener("focus", refresh);
    return () => { revision.current++; window.removeEventListener("slate:session-check", refresh); window.removeEventListener("focus", refresh); };
  }, [reload]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0E1318" : "#2B3643");
  }, [theme]);
  const authenticate = useCallback(async (kind: "login" | "register", values: Record<string, string>) => {
    const result = await api<{ user: SessionUser }>(`/auth/${kind}`, { method: "POST", body: JSON.stringify(values) });
    revision.current++;
    setAccount(result.user); setDemoRole(null); setError(""); setReady(true); write("slate-preview-role", null);
  }, []);
  const signIn = useCallback((role: Role) => {
    if (!DEMO_ENABLED || !ROLES.includes(role) || account) return;
    setDemoRole(role); setReady(true); write("slate-preview-role", role);
  }, [account]);
  const signOut = useCallback(async () => {
    if (account) await api("/auth/logout", { method: "POST", body: "{}" });
    revision.current++;
    setAccount(null); setDemoRole(null); write("slate-preview-role", null); write("slate-role", null);
  }, [account]);
  const setTheme = useCallback((value: "light" | "dark") => { setThemeState(value); write("slate-theme", value); }, []);
  const role = account?.role as Role | undefined ?? demoRole;
  const user = account ? { name: account.name, email: account.email, role: "Household" } : userForRole(demoRole);
  return <SessionContext.Provider value={{ role, mode: account ? "account" : demoRole ? "demo" : null, account, ready, error, reload, authenticate, signIn, signOut, user, theme, setTheme }}>{children}</SessionContext.Provider>;
}
export function useSession(): Session {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
