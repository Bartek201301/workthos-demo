# workthos website: design

## Mood

The poster of a weekend outdoor race, cast with friendly robots. Warm sand paper, bold uppercase type, sticker-like cards, forest green and lavender accents, short cheeky copy. It is energetic but calm to read: big type and space, few effects, each effect with a job.

Reference: the website of an outdoor gravel event. Take its warmth, its uppercase display type, its big numbers band, its event cards and its schedule. Do not copy its text, logo, photos or exact layout.

## Colour

All colours are tokens in `styles/tokens.css`. Never write a hex value in a component.

| Token | Hex | Use |
|---|---|---|
| `--sand-50` | `#F6F1E4` | page background |
| `--sand-100` | `#EFE7D3` | alternate section background |
| `--sand-200` | `#DBD0B4` | card borders, dividers |
| `--ink` | `#363229` | text |
| `--ink-soft` | `#6B6455` | secondary text |
| `--forest` | `#15663C` | primary buttons, key numbers |
| `--sage` | `#84BA8F` | secondary accents, success |
| `--lavender` | `#A980C4` | accent, highlights |
| `--lilac` | `#CCA7E4` | soft accent backgrounds |
| `--plum` | `#59396E` | dark accent, footer |

Chart colours: `--chart-1` forest, `--chart-2` lavender, `--chart-3` sage, `--chart-4` plum, `--chart-5` lilac. Text on forest or plum is `--sand-50`. Check contrast: body text at least 4.5:1.

## Type

- **Display:** Bricolage Grotesque, 700 to 800, uppercase, tight letter spacing (-0.02em). Hero wordmark `clamp(4rem, 14vw, 10rem)`. Section titles `clamp(2.5rem, 6vw, 4.5rem)`.
- **Body:** Manrope 400 to 600, 18 px base, line height 1.55.
- **Accent:** Kalam, only for small handwritten notes next to things ("this one merges"), at most one per section.
- Big numbers in the numbers band use the display font in `--forest`.

## Shapes and layout

- Cards: radius 24 px, 2 px border in `--sand-200`, no heavy shadows (one soft shadow token at most).
- Buttons: pill shaped. Primary is the gooey button in `--forest` with `--sand-50` text. Secondary is an outline in `--ink`.
- Content width 1200 px, generous vertical rhythm (sections 120 px apart on desktop, 72 px on mobile).
- Event-poster details are welcome: a date-like label above a section title, small uppercase tags, a dashed divider.

## The robots (`bot-avatars`)

Plush fur (the default `fabric` shading), never `shading="plastic"`, so they fit the warm palette. Each robot is a role, never decoration.

| Role | Type | Why |
|---|---|---|
| lead | `flower` | green, calm, the planner |
| builder | `circle` | lavender, the worker; several builders can use `circle` and `blob` |
| machine | `mech` | slate, the deterministic one |

States follow meaning: `working` when that role is doing something in the story, idle otherwise, sleeping in the footer. At most three robots on screen at once. Avoid the sky, coral and yellow types: they are outside the palette.

## Effects (and their limits)

- **Gooey** (`liquid-gooey`): the primary buttons and, at most, one gooey blob group in the hero.
- **Border beam** (`border-beam`): only on the install command box.
- **No liquid metal** (`metal-fx`): it clashes with the warm, flat style.
- **React Bits background:** one per page at most, only in the hero, slow and subtle, tinted with sand, lilac and sage. Good candidates: a soft silk or wave background, or fine grain. Off under reduced motion.
- **Motion:** sections rise 24 px and fade in over 0.5 s once; the numbers count up once; robots hop slightly on hover. All off under reduced motion.

## Images

Only from `docs/assets/`, copied to `public/images/` and shown with `next/image`. Warm photos fit; avoid cold blue stock images. A missing image becomes a sand placeholder box with the intended file name.

## Dashboard

The same tokens and fonts as the home page; it must feel like the same site, not a default admin theme. Charts sit in sand cards with uppercase small titles. The header row shows the three robots and the one-line status. Tooltips use `--ink` text on `--sand-50`.

## Voice

Short, energetic, a little cheeky. Examples: "You plan. They build. The machine merges." "Zero conflicts. Not a typo." "Every file has an owner."
