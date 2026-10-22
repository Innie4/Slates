import { api } from "./api";

export type AuthProvider = "google" | "apple";
export interface AuthMethodsConfig { methods: { google: boolean; apple: boolean; passkeys: boolean } }

export function safeDestination(next: string | null | undefined) {
  return next?.startsWith("/app/") && !/[\\\u0000-\u0020]/.test(next) ? next : "/app/dashboard";
}

export async function beginOAuth(provider: AuthProvider, intent: "login" | "signup" | "link", next: string, signal?: AbortSignal) {
  const { url } = await api<{ url: string }>(`/auth/oauth/${provider}/start`, {
    method: "POST", body: JSON.stringify({ intent, next: safeDestination(next) }), signal,
  });
  const destination = new URL(url);
  const expectedHost = provider === "google" ? "accounts.google.com" : "appleid.apple.com";
  if (destination.protocol !== "https:" || destination.hostname !== expectedHost) throw new Error("Couldn't open the sign-in provider. Please try again.");
  if (!signal?.aborted) window.location.assign(destination.href);
}

export function passkeyMessage(cause: unknown) {
  if (cause instanceof Error && (cause.name === "NotAllowedError" || cause.name === "AbortError")) return "The passkey prompt was closed or timed out. Try again, or use another sign-in method.";
  if (cause instanceof Error && cause.name === "InvalidStateError") return "This device already has that passkey. Use it to sign in, or choose another device.";
  return cause instanceof Error ? cause.message : "Couldn't use your passkey. Please try again.";
}

export const authErrorMessages: Record<string, string> = {
  unavailable: "This sign-in method is not available yet. Use your email and password.",
  cancelled: "Sign-in was cancelled. You can try again or use another method.",
  expired: "That sign-in request expired. Please start again.",
  failed: "We couldn't verify that sign-in. Please try again.",
  account_exists: "An account already uses this email. Sign in with your existing method, then connect Google in Your account.",
  sign_in_first: "Sign in to your existing account before connecting another sign-in method.",
};
