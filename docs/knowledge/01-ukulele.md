# The ukulele: instrument background

Everything in this file is background the app's design depends on. Numbers are
equal-temperament values at A4 = 440 Hz unless stated otherwise.

## Origin

- Descends from small Portuguese guitar-family instruments from Madeira: the
  **machete** (also called *machete de braga*), the *cavaquinho* and the
  *rajão* (a five-string instrument whose re-entrant tuning is one plausible
  source of the ukulele's re-entrant tuning).
- Madeiran immigrants arrived in Honolulu in 1879 aboard the *Ravenscrag*.
  Three cabinet makers on that voyage, Manuel Nunes, José do Espírito Santo and
  Augusto Dias, became the first ukulele makers in Hawaii.
- The exact date the machete reached Hawaii is disputed; no contemporary
  references exist before 1879.
- The word *ʻukulele* is usually translated from Hawaiian as "jumping flea",
  though other folk etymologies exist.
- The instrument spread to the US mainland after the 1915 Panama-Pacific
  Exposition in San Francisco and boomed in the 1920s. Sheet music from the
  1920s and 1930s often assumes **D tuning** (A-D-F#-B), not today's C tuning.

## Sizes

| Size     | Scale length (approx.) | Overall length | Era of origin | Usual tuning                  |
|----------|------------------------|----------------|---------------|-------------------------------|
| Soprano  | 13 in / 33 cm          | 21 in / 53 cm  | 1880s (original size) | G4-C4-E4-A4 (re-entrant) |
| Concert  | 15 in / 38 cm          | 23 in / 58 cm  | 1920s         | G4-C4-E4-A4 (re-entrant)      |
| Tenor    | 17 in / 43 cm          | 26 in / 66 cm  | 1920s         | G4-C4-E4-A4 or low-G G3-C4-E4-A4 |
| Baritone | 19 in / 48 cm          | 30 in / 76 cm  | 1940s         | D3-G3-B3-E4 (linear, like guitar strings 4-1) |

Other, less common members of the family:

| Size            | Typical tuning                 | Notes |
|-----------------|--------------------------------|-------|
| Sopranino / piccolo | often D tuning A4-D4-F#4-B4, sometimes higher | tiny, rare |
| Bass ukulele (U-Bass style) | E1-A1-D2-G2 (41.2–98 Hz) | thick rubber/polyurethane strings; pitch detection at 41 Hz needs much longer analysis windows. Out of scope unless requested. |
| Guitalele / guilele | A2-D3-G3-C4-E4-A4 | six strings, a guitar tuned up a fourth. Possible extension. |
| Banjolele (banjo ukulele) | usually D tuning A-D-F#-B | banjo body, 1920s/30s instrument. |

Scale length matters to the app only indirectly: it sets string tension and
therefore how much pitch drifts while a string settles. A soprano with its
short scale and low tension is the most sensitive to small peg movements.

## Strings

- Four strings, numbered **4 to 1 from the player's chin toward the floor**.
  In standard C tuning string 4 is G, string 3 is C, string 2 is E, string 1 is
  A. Tuning charts and the app should list strings in that order (G C E A).
- Materials: nylon (warm, lower tension, stretches most), fluorocarbon
  (brighter, higher tension, holds tune better, more accurate intonation),
  Nylgut and similar synthetic gut (Aquila; the common factory string), and
  **wound** strings (metal winding over a core) for low G and baritone's two
  lowest strings.
- Vendor data for tension: a Martin soprano/concert set lists 35.4 (likely
  lb total), a tenor set 55.3. Figures are indicative only.
- **New strings stretch.** Nylon and fluorocarbon strings keep settling for
  days. The normal routine is: tune, gently pull each string away from the
  fretboard, retune, repeat 3 to 5 times. The app should expect that a string
  that was just tuned reads flat again within minutes on a new set, and should
  not treat that as a bug.

## Re-entrant tuning (the ukulele's defining quirk)

- In standard tuning the 4th string (G4) is **higher** in pitch than the 3rd
  (C4) and 2nd (E4). The pitches do not go low to high across the strings.
  This is called *re-entrant* tuning. It gives the instrument its
  characteristic bright, "my dog has fleas" sound (that phrase, sung on
  G-C-E-A, is the classic mnemonic for the open strings).
- "**High G**" = re-entrant G4 (392.00 Hz). "**Low G**" = linear G3 (196.00 Hz),
  a different, thicker string, usually wound or thick fluorocarbon. You cannot
  tune a high-G string down to G3 (it goes floppy) or a low-G string up to G4
  (it will likely snap).
- Consequence for the app: **the G string is the most common source of octave
  mistakes**. A tuner that only shows the note name "G" lets a user wind a
  low-G string toward G4 and break it. The app must show the octave (G3 vs G4)
  and should warn when the detected pitch is roughly an octave from the target
  of the selected string.
- Baritone (D3-G3-B3-E4) and low-G C tuning are **linear** (low to high).
- The vintage tenor "G tuning" was D-G-B-E with a re-entrant high D (D4-G3-B3-E4).

## Intonation and what a tuner can and cannot fix

- A tuner only sets the **open string** pitch. If the fretted 12th-fret note is
  sharp or flat relative to the 12th-fret harmonic, the problem is the saddle
  position, nut height or string, not the tuning.
- Checking the 12th-fret harmonic against the fretted 12th-fret note is the
  standard intonation check. Luthiers note the harmonic always sits at the
  true octave of the open string, so it is a good reference tone.
- Cheap ukuleles frequently intonate sharp up the neck. The app can offer an
  "intonation check" mode later (compare open vs 12th fret), but v1 should
  focus on open strings.

## Environmental facts a tuner should tolerate

- Nylon strings drift with temperature and humidity; a uke taken from a cold
  car into a warm room goes sharp or flat by several cents within minutes.
- Tuning one string changes the tension on the neck and top, which nudges the
  other strings slightly. Users should go round all four strings twice.
- Tuning pegs (friction pegs on cheap sopranos, geared tuners elsewhere) have
  mechanical slack. **Always finish by tuning up to the pitch**, never down to
  it. If a string is sharp, go below the target and come back up.
