export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string, public requestId?: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Same-origin cookies carry the session. Requests never store bearer tokens in the browser. */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`/api${path}`, {
      ...options,
      credentials: "same-origin",
      signal: options.signal ?? controller.signal,
      headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error = body?.error;
      if (response.status === 401 && !path.startsWith("/auth/")) window.dispatchEvent(new Event("slate:session-check"));
      throw new ApiError(error?.message ?? "We couldn't complete the request. Please try again.", response.status, error?.code ?? "REQUEST_FAILED", body?.requestId);
    }
    if (body === null) throw new ApiError("The server returned an unexpected response. Please try again.", response.status, "INVALID_RESPONSE");
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new ApiError("The request timed out. Your request may have been saved. Retry to check.", 0, "TIMEOUT");
    throw new ApiError("Couldn't reach Slate. Check your connection and try again.", 0, "OFFLINE");
  } finally {
    window.clearTimeout(timer);
  }
}

export const messageFor = (error: unknown) => error instanceof Error ? error.message : "We couldn't complete the request. Please try again.";
