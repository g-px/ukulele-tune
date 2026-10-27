# Ukulele tunings: reference table

All frequencies are 12-tone equal temperament, A4 = 440 Hz, rounded to two
decimals. `f = 440 · 2^((midi − 69) / 12)`. Strings are listed **4 → 1**
(closest to the chin first), which is how every ukulele chart is written.

The MIDI number column is what the code should store; derive the frequency at
runtime from the user's chosen A4 reference so calibration (A = 432, 442 …)
works for every tuning for free.

## Note → frequency lookup used below

| Note | MIDI | Hz      | Note | MIDI | Hz      |
|------|------|---------|------|------|---------|
| D3   | 50   | 146.83  | D4   | 62   | 293.66  |
| D#3  | 51   | 155.56  | D#4  | 63   | 311.13  |
| E3   | 52   | 164.81  | E4   | 64   | 329.63  |
| F3   | 53   | 174.61  | F4   | 65   | 349.23  |
| F#3  | 54   | 185.00  | F#4  | 66   | 369.99  |
| G3   | 55   | 196.00  | G4   | 67   | 392.00  |
| G#3  | 56   | 207.65  | G#4  | 68   | 415.30  |
| A3   | 57   | 220.00  | A4   | 69   | 440.00  |
| A#3  | 58   | 233.08  | A#4  | 70   | 466.16  |
| B3   | 59   | 246.94  | B4   | 71   | 493.88  |
| C4   | 60   | 261.63  | C5   | 72   | 523.25  |
| C#4  | 61   | 277.18  |      |      |         |

## Primary tunings (should be in v1)

### 1. Standard C, high G (re-entrant) — "gCEA"
Default for soprano, concert and tenor. By far the most common.

| String | Note | MIDI | Hz     |
|--------|------|------|--------|
| 4      | G4   | 67   | 392.00 |
| 3      | C4   | 60   | 261.63 |
| 2      | E4   | 64   | 329.63 |
| 1      | A4   | 69   | 440.00 |

### 2. Standard C, low G (linear) — "GCEA"
Same as above with the 4th string an octave lower. Popular on tenors and for
fingerstyle/jazz. Requires a dedicated low-G string.

| String | Note | MIDI | Hz     |
|--------|------|------|--------|
| 4      | G3   | 55   | 196.00 |
| 3      | C4   | 60   | 261.63 |
| 2      | E4   | 64   | 329.63 |
| 1      | A4   | 69   | 440.00 |

### 3. Baritone — "DGBE"
Linear, identical to guitar strings 4-1. Strings 4 and 3 are usually wound.

| String | Note | MIDI | Hz     |
|--------|------|------|--------|
| 4      | D3   | 50   | 146.83 |
| 3      | G3   | 55   | 196.00 |
| 2      | B3   | 59   | 246.94 |
| 1      | E4   | 64   | 329.63 |

## Secondary tunings (presets worth having; cheap once the engine exists)

### 4. D tuning / "English" tuning (re-entrant) — "aDF#B"
Every string a whole step above standard C. Historical standard for sopranos
and the tuning assumed by most 1920s–30s sheet music; still used on banjoleles
and by players who like the extra string tension and brightness.

| String | Note | MIDI | Hz     |
|--------|------|------|--------|
| 4      | A4   | 69   | 440.00 |
| 3      | D4   | 62   | 293.66 |
| 2      | F#4  | 66   | 369.99 |
| 1      | B4   | 71   | 493.88 |

### 5. "Canadian" tuning (low A, linear) — "ADF#B"
D tuning with the 4th string dropped an octave. Associated with the Canadian
school method (Chalmers Doane, James Hill).

| String | Note | MIDI | Hz     |
|--------|------|------|--------|
| 4      | A3   | 57   | 220.00 |
| 3      | D4   | 62   | 293.66 |
| 2      | F#4  | 66   | 369.99 |
| 1      | B4   | 71   | 493.88 |

### 6. Slack-key / open C — "gCEG"
Standard C with the 1st string lowered to G, so the open strings sound a C
major chord. Borrowed from Hawaiian slack-key guitar. 4th string high or low.

| String | Note | MIDI | Hz     |
|--------|------|------|--------|
| 4      | G4 (or G3) | 67 (55) | 392.00 (196.00) |
| 3      | C4   | 60   | 261.63 |
| 2      | E4   | 64   | 329.63 |
| 1      | G4   | 67   | 392.00 |

### 7. B♭ tuning (standard C down a whole step, re-entrant) — "fB♭DG"
Occasionally used for a mellower sound or to match a singer.

| String | Note | MIDI | Hz     |
|--------|------|------|--------|
| 4      | F4   | 65   | 349.23 |
| 3      | A#3  | 58   | 233.08 |
| 2      | D4   | 62   | 293.66 |
| 1      | G4   | 67   | 392.00 |

### 8. Half-step down (re-entrant) — "f#BD#G#"

| String | Note | MIDI | Hz     |
|--------|------|------|--------|
| 4      | F#4  | 66   | 369.99 |
| 3      | B3   | 59   | 246.94 |
| 2      | D#4  | 63   | 311.13 |
| 1      | G#4  | 68   | 415.30 |

### 9. Vintage tenor "G tuning" / baritone re-entrant — "dGBE"
Baritone intervals with the 4th string an octave up.

| String | Note | MIDI | Hz     |
|--------|------|------|--------|
| 4      | D4   | 62   | 293.66 |
| 3      | G3   | 55   | 196.00 |
| 2      | B3   | 59   | 246.94 |
| 1      | E4   | 64   | 329.63 |

## Out of scope for now (noted so the data model does not exclude them)

| Instrument | Tuning | Lowest Hz | Why it matters |
|------------|--------|-----------|----------------|
| Bass ukulele | E1-A1-D2-G2 | 41.20 | needs ≥ 4096-sample windows and a different high-pass filter |
| Guitalele | A2-D3-G3-C4-E4-A4 | 110.00 | six strings; the data model should allow N strings |
| Sopranino | A4-D4-F#4-B4 or C5-F4-A4-D5 | – | just another preset |

## Pitch range the detector must cover

For the nine presets above the targets span **D3 (146.83 Hz) to B4 (493.88 Hz)**.
Allowing for a string being up to a fifth off, or the user plucking the wrong
octave, the detector should accept roughly **100 Hz to 1000 Hz** and reject
anything outside as "no note". A high-pass filter around 80–100 Hz is safe for
every preset and removes 50/60 Hz mains hum. Guitalele (110 Hz) still fits;
bass ukulele does not.

## Data model sketch

```ts
type Tuning = {
  id: string;             // "c-high-g"
  name: string;           // "Standard C (high G)"
  reentrant: boolean;
  sizes: ("soprano"|"concert"|"tenor"|"baritone")[];
  strings: { number: 4|3|2|1; midi: number }[]; // order 4 → 1
};
```

Frequency is never stored; it is `a4 * 2 ** ((midi - 69) / 12)` with `a4`
from user settings (default 440).
