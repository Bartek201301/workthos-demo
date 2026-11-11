# workthos website: technical specification

## Stack

- Next.js (latest stable, App Router), TypeScript, React 19.
- Tailwind CSS v4.
- shadcn/ui for components and **shadcn charts** (Recharts) for the dashboard. Use the shadcn skill in `.agents/skills/shadcn` and `.claude/skills/shadcn`.
- Motion (`motion` package) for scroll reveals and number count-ups.
- Libraries.dev: `bot-avatars` (the robots), `liquid-gooey` (the main buttons), `border-beam` (only on the install command box). Use the skill in `.claude/skills/libraries-dev`; read its reference file before using a component, never guess a prop.
- React Bits: at most one background effect per page, installed through the shadcn CLI from reactbits.dev. Licence MIT + Commons Clause: allowed inside this website.
- Fonts with `next/font/google`: Bricolage Grotesque (display), Manrope (body), Kalam (handwritten accents). No font files in the repository.
- npm, Node 22. The site builds as a static site (`output: 'export'` if nothing needs a server).

## Scripts (a contract)

- `npm test` runs the type check (`tsc --noEmit`), ESLint and the unit tests (Vitest). It must exist from the first task and pass on every PR.
- `npm run build` must pass on every PR.
- The merge machine runs `npm ci && npm test && npm run build` on each PR merged with the newest main. CI runs the same in the job `test`.
- Visual check: before opening a PR that changes what a page looks like, the builder starts the dev server on its own port (3000 plus the task number) and takes Playwright screenshots at 390 px and 1440 px wide. It describes what it checked in the Workflow notes. Screenshots are not committed.

## Folder layout and owners

| Path | Owner |
|---|---|
| `styles/**` (design tokens) | human UI lane: only `ui/` tasks |
| `data/**` (build statistics) | contracts lane: only tasks labelled `contracts` |
| `docs/**` | docs lane: builders read only |
| `.claude/**`, `.agents/**`, `.github/**`, `owners.yml`, `workthos.config.json`, `skills-lock.json` | machine lane: only the human |
| `app/**` | routes and layout: one task at a time per route folder |
| `components/ui/**` | shadcn generated components |
| `components/brand/**` | robots, gooey buttons, backgrounds, section shell |
| `components/home/**` | home page sections |
| `components/dashboard/**` | dashboard charts and table |
| `lib/**` | helpers, including the typed loader for `data/build-stats.json` |
| `public/images/**` | images copied from `docs/assets/` |

Each task's Paths name the exact folders it owns. Two tasks in progress never share a path.

## Dependencies (a rule)

`package.json` and `package-lock.json` change in the foundation task, which installs every dependency listed above. A later task may change them only when its Paths name them, and the lead never runs two such tasks at once. This keeps lock-file conflicts out.

## Contracts

1. **Design tokens** in `styles/tokens.css` (already in the repository): CSS variables for colours, radii, shadows and the chart colours `--chart-1` to `--chart-5`. `app/globals.css` imports it and maps the tokens to Tailwind and to the shadcn theme variables. Components use only tokens, never raw hex values.
2. **Build data** in `data/build-stats.json` (already in the repository): `{ generatedAt, note, projects: [{ name, description, repository, summary: { mergedPullRequests, abandonedPullRequests, conflictsInMain, medianMinutesToMerge, linesAdded, linesDeleted }, pullRequests: [{ number, title, kind, openedAt, mergedAt, minutesToMerge, additions, deletions }] }] }`. `lib/build-stats.ts` loads it with types; pages never read the JSON directly.
3. **Brand components** in `components/brand/`, with these props:
   - `<Robot role="lead" | "builder" | "machine" state="idle" | "working" | "sleeping" size?>`: wraps `BotAvatar` with the type mapping in `docs/design.md`; `idle` maps to the BotAvatar state `default`.
   - `<GooeyButton href|onClick variant="primary" | "secondary">`: wraps `liquid-gooey`.
   - `<SectionBackground kind="hero">`: the only React Bits background, disabled under reduced motion.
   - `<Reveal>`: the Motion scroll reveal, disabled under reduced motion.

## Suggested waves (the lead decides)

1. **Foundation** (one builder, opus): the Next.js app, Tailwind, the shadcn setup with tokens wired, fonts, the layout with navigation and footer, `lib/build-stats.ts`, Vitest, ESLint, `npm test`, and an empty route for `/dashboard`. CI and the machine's test command pass.
2. **In parallel**: brand components; home sections 1 to 3; home sections 4 to 6; dashboard charts; dashboard table and header.
3. **In parallel**: home sections 7 to 9; responsive and accessibility pass; Lighthouse pass.
