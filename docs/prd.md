# workthos website: product requirements

## What we are building

A two-page website for **workthos**, an open source workflow that lets one developer run many Claude Code sessions in parallel on one GitHub repository. It has three roles: a lead session that plans and reviews, builder sessions that each do one task in their own worktree, and a merge machine with no model that is the only thing that merges into main.

The site should feel like the poster of an outdoor event: warm, bold, energetic and a little cheeky. It uses friendly animated robots as the cast. See `docs/design.md`.

## Who it is for

Developers who already use Claude Code and want to go faster with several sessions at once, without merge conflicts and without trusting agent reports blindly.

## Goals

1. In 30 seconds a visitor understands what workthos does: you plan, builders build in parallel, the machine merges only what was reviewed.
2. The visitor sees proof: real numbers and charts from two real builds.
3. The visitor knows how to start: the repository link and the install command.

## Pages

### 1. Home (`/`)

Sections, in order:

1. **Hero.** A huge uppercase wordmark `WORKTHOS`, one line of tagline ("You plan. They build. The machine merges."), and two buttons: "See how it works" (scrolls down) and "Get started" (scrolls to the install section). The three robots (lead, builder, machine) appear here, the builder in its `working` state.
2. **Numbers band.** Four big numbers from `data/build-stats.json`: merged pull requests (both builds), conflicts in main, median minutes from PR to merge, and lines added. They count up when they scroll into view.
3. **How it works.** The loop in four steps (plan, build, review, merge), each with its robot and one short sentence. The merge step says plainly that no model merges.
4. **The rules.** Four cards: one task, one worktree, one PR; every file has an owner; the lead approves one exact commit; only the machine merges.
5. **Your UI lane.** One section on how the human keeps editing the look while builders work: the human owns the design files, the builders read them.
6. **A day with workthos.** A timeline like an event schedule (for example 09:00 plan the wave, 09:10 four builders start, 10:30 first merges, 18:00 the machine merged 20 PRs). Illustrative times, labelled as an example.
7. **Proof.** A teaser of the dashboard (one small chart and a button "Open the dashboard").
8. **FAQ.** Five or six short questions (Do I need an organization repo? No. Which models? The lead picks Sonnet or Opus per task. Does it work with Codex? Not in version 1. What if a builder goes outside its task? The hook blocks it, and the machine rejects the PR.)
9. **Install and footer.** The install command in a code box with a copy button, the repository link, and a sleeping robot.

### 2. Dashboard (`/dashboard`)

Linked from the home page and the navigation. It shows the real data of `data/build-stats.json` (two projects: HackWin and workthos).

- A header row with the robots and a one-line status ("2 builds, 92 pull requests, 0 conflicts in main").
- A project switch: HackWin, workthos, or both.
- Charts (shadcn charts):
  1. pull requests merged per day (bar chart);
  2. minutes from PR opened to merged, per PR, with the median as a line;
  3. lines added and deleted per day (stacked area or bars);
  4. task PRs vs log PRs (donut).
- A table of the latest 20 merged pull requests: number, title, minutes to merge, lines added.
- Every number on the page comes from the data file. Nothing is invented.

## Content rules

- English, short sentences, energetic tone. No lorem ipsum in the final pages.
- Images come only from `docs/assets/` (copied to `public/images/`). If a planned image is missing, show a sand placeholder box with the intended file name and record it in the PR's Workflow notes.
- The style is inspired by an outdoor sports event website. Do not copy its text, logo, photos or layout one to one.

## Quality bar

- Works from 360 px to 1440 px wide, with no horizontal scroll.
- Lighthouse on the home page (desktop): performance 90 or more, accessibility 95 or more.
- Respects `prefers-reduced-motion`: no scroll animations, no WebGL background, robots stay still.
- Keyboard navigation works and focus is visible.

## Not in this version

A backend, sign-in, a CMS, live data, dark mode, a blog, translations.
