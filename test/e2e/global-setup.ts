import { TONES, writeTone } from "./wav";

export default function globalSetup(): void {
  for (const t of Object.values(TONES)) writeTone(t.file, t.freq);
}
