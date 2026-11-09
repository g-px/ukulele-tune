# Beginners: identifying the ukulele and finding the strings

What a first-time player needs to know before a tuner is useful, and what
the app can work out for them. Sources are in `sources.md` and
`01-ukulele.md`/`02-tunings.md`.

## What actually decides the tuning

| Question | Why it matters | How a beginner can tell |
|----------|----------------|-------------------------|
| Is it a baritone? | Baritone is tuned D G B E; every other common size is G C E A. | Overall length about 76 cm / 30 in (soprano ≈ 53, concert ≈ 58, tenor ≈ 66 cm). The size is often printed on the label inside the sound hole. |
| High G or low G? | Same notes, but string 4 is an octave apart. A low-G string tuned up to G4 snaps; a high-G string tuned down to G3 goes floppy. | Compare string 4 with string 3: **thinner** = high G (most ukuleles, factory default), **thicker, often metal-wound** = low G. |
| Anything else? | D tuning, slack-key, B♭ and vintage G are deliberate choices; a beginner who does not know the word does not have them. | Not asked. Reachable from Settings. |

Soprano, concert and tenor need no different setting: size changes string
tension and how sensitive the pegs feel, not the notes.

## Telling high G from low G by ear, even out of tune

- High G (re-entrant): string 4 (G4, 392 Hz) sounds **higher** than string 3
  (C4, 262 Hz): +7 semitones.
- Low G and baritone (linear): string 4 sounds **lower** than string 3:
  G3→C4 and D3→G3 are both −5 semitones.
- The sign of the interval between strings 4 and 3 survives several
  semitones of detuning on either string, and does not depend on the A4
  reference. A brand-new uke straight from the box is rarely more than
  2–3 semitones off; the decision margin is ±5 semitones from the boundary.
- Baritone vs low G when the size is unknown: baritone string 4 is D3
  (147 Hz) and string 3 is G3 (196 Hz); low-G string 4 is G3 (196 Hz) and
  string 3 is C4 (262 Hz). Boundaries at the geometric means (≈170 Hz and
  ≈226 Hz) give ±2.5 semitones of tolerance, which is weaker, so size
  wins whenever the user knows it.

## Holding it and naming the strings

- Right-handed: neck to the left, strings facing out, strum over the sound
  hole with the right hand. Left-handed players usually flip it (neck to the
  right) and often restring it; either way the app identifies strings by
  pitch, so only the instructions change.
- Strings are numbered **4 to 1 from the player's face toward the floor**:
  4 = G, 3 = C, 2 = E, 1 = A in standard tuning. Saying "the string closest
  to your face" is clearer to a beginner than "the top string" (top of what?).
- Peg layout varies (2+2 on most, 4-in-line on some, geared or friction pegs),
  and so does which way a peg turns to tighten. Do not draw a peg map as fact.
  Tell the user to run a finger along the string to its peg, turn a little,
  pluck, and watch the needle; if it moves the wrong way, turn the other way.
- Tighten = higher pitch, loosen = lower. Finish by tuning **up** to the note.
- Tuning one string changes the others slightly (neck tension), so beginners
  should go round all four strings twice.

## Portuguese (Brazil) vocabulary

| English | pt-BR | Note |
|---------|-------|------|
| tuner | afinador | |
| tuning | afinação | |
| string | corda | |
| tuning peg | tarraxa | "cravelha" is also heard; use tarraxa |
| tighten / loosen | apertar / afrouxar | |
| higher / lower (pitch) | mais aguda / mais grave | never "mais alta/baixa" (that is volume) |
| high G / low G | Sol agudo / Sol grave | "G agudo / G grave" also common |
| re-entrant | reentrante | |
| sound hole | boca | "boca do ukulele" |
| head(stock) | mão | "cabeça" also used |
| neck | braço | |
| pluck | tocar / beliscar | use "tocar a corda" |
| in tune / flat / sharp | afinado / abaixo / acima | dial labels "♭ abaixo" / "acima ♯"; bemol/sustenido are note names, not states |
| sizes | Soprano, Concert, Tenor, Barítono | Brazilian shops say "Concert", not "Concerto" |

Brazilian players use both letter names (cifra: C D E F G A B) and solfège
(Dó Ré Mi Fá Sol Lá Si). Chord charts use letters; teachers and beginners
often say "Sol Dó Mi Lá". The app keeps letters on the tuner display and adds
solfège in brackets in pt-BR guidance text ("G (Sol)").
