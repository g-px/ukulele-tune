import { SEQUENCES, TONES, WRONG_WAY, writeSequence, writeTone } from "./wav";

export default function globalSetup(): void {
  for (const t of Object.values(TONES)) writeTone(t.file, t.freq);
  for (const s of Object.values(SEQUENCES)) writeSequence(s.file, s.segments);
  writeSequence(WRONG_WAY.file, WRONG_WAY.segments);
}
