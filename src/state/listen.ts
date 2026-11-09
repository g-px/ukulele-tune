/**
 * Listen-step sequencing (beginner-setup.md §4.3): capture string 4, then
 * string 3 once string 4 has stopped or a clearly different note is playing.
 */
import {
  CAPTURE_GAP_MS,
  CAPTURE_MIN_CHANGE_CENTS,
  CAPTURE_MIN_MS,
  CAPTURE_TOLERANCE_CENTS,
} from "../config";
import { centsBetween } from "../core/pitch-math";
import { createStableCapture } from "../core/stable-capture";
import type { ListenState } from "./setup";

export interface ListenFrame {
  status: "silent" | "noisy" | "note";
  frequency: number;
  timeMs: number;
}

export function createListenSequencer() {
  const capture = createStableCapture({
    minMs: CAPTURE_MIN_MS,
    toleranceCents: CAPTURE_TOLERANCE_CENTS,
  });
  let silentSinceMs: number | null = null;
  let gateOpen = false;

  function reset(): void {
    capture.reset();
    silentSinceMs = null;
    gateOpen = false;
  }

  /** Returns the updated listen state when a string was captured, else null. */
  function push(listen: ListenState, f: ListenFrame): ListenState | null {
    const hz = f.status === "note" ? f.frequency : 0;
    if (listen.string4Hz === null) {
      const got = capture.push(hz, f.timeMs);
      if (got === null) return null;
      reset();
      return { ...listen, string4Hz: got };
    }
    if (listen.string3Hz !== null) return null;
    if (!gateOpen) {
      if (f.status === "silent") {
        silentSinceMs ??= f.timeMs;
        gateOpen = f.timeMs - silentSinceMs >= CAPTURE_GAP_MS;
      } else {
        silentSinceMs = null;
        gateOpen =
          hz > 0 && Math.abs(centsBetween(hz, listen.string4Hz)) > CAPTURE_MIN_CHANGE_CENTS;
      }
      if (!gateOpen) return null;
    }
    const got = capture.push(hz, f.timeMs);
    return got === null ? null : { ...listen, string3Hz: got };
  }

  return { push, reset };
}
