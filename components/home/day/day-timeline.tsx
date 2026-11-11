import { Reveal } from "@/components/brand";

const entries = [
  { time: "09:00", text: "You plan the wave with the lead." },
  { time: "09:10", text: "Four builders start, each in its own worktree." },
  { time: "10:30", text: "First merges land. The machine merges them." },
  { time: "18:00", text: "The machine merged 20 PRs. Zero conflicts." },
];

export function DayTimeline() {
  return (
    <section id="day" className="bg-sand-100">
      <Reveal>
        <div className="mx-auto max-w-content px-4 py-section-mobile sm:px-6 md:py-section">
          <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">
            Example day, illustrative times
          </p>
          <h2 className="font-display text-section leading-none font-extrabold tracking-display uppercase">
            A day with workthos
          </h2>
          <ol className="mt-10 max-w-3xl">
            {entries.map((entry) => (
              <li
                key={entry.time}
                className="flex flex-col gap-1 border-b-2 border-dashed border-sand-200 py-5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-8"
              >
                <time className="font-display text-3xl font-extrabold tracking-display text-forest sm:w-28">
                  {entry.time}
                </time>
                <p className="text-lg">{entry.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}
