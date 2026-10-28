export type MicError =
  "denied" | "not-found" | "in-use" | "insecure-context" | "unsupported" | "unknown";

/** Map a getUserMedia rejection (or environment check) to a user-facing cause. */
export function classifyMicError(e: unknown): MicError {
  const name =
    typeof e === "object" && e !== null && "name" in e ? String((e as { name: unknown }).name) : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "not-found";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "in-use";
    case "InsecureContextError":
      return "insecure-context";
    case "UnsupportedError":
    case "NotSupportedError":
    case "TypeError":
      return "unsupported";
    default:
      return "unknown";
  }
}

/** Errors we raise ourselves before calling getUserMedia. */
export function micEnvironmentError(env: {
  isSecureContext: boolean;
  hasGetUserMedia: boolean;
  hasAudioContext: boolean;
}): MicError | null {
  if (!env.isSecureContext) return "insecure-context";
  if (!env.hasGetUserMedia || !env.hasAudioContext) return "unsupported";
  return null;
}
