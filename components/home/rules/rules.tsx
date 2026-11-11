import { Reveal } from "@/components/brand";

const rules = [
  {
    tag: "Rule 01",
    title: "One task, one worktree, one PR",
    text: "Each builder gets one job and its own worktree: a separate working folder of the same repository.",
  },
  { tag: "Rule 02", title: "Every file has an owner", text: "Stay inside your paths. The hook blocks the rest." },
  { tag: "Rule 03", title: "The lead approves one exact commit", text: "Approval is tied to a single commit, not a vibe." },
  { tag: "Rule 04", title: "Only the machine merges", text: "No model merges. The machine checks and does it." },
];

export function Rules() {
  return (
    <section id="rules" className="bg-sand-100">
      <Reveal>
        <div className="mx-auto max-w-content px-4 py-section-mobile sm:px-6 md:py-section">
          <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">The house rules</p>
          <h2 className="font-display text-section leading-none font-extrabold tracking-display uppercase">
            The rules
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {rules.map((rule) => (
              <li key={rule.title}>
                <article className="h-full rounded-card border-2 border-sand-200 bg-sand-50 p-6 md:p-8">
                  <p className="inline-block rounded-pill bg-lilac px-3 py-1 text-xs font-semibold tracking-wide text-ink uppercase">
                    {rule.tag}
                  </p>
                  <h3 className="mt-4 font-display text-2xl leading-tight font-bold tracking-display uppercase">
                    {rule.title}
                  </h3>
                  <p className="mt-2 text-ink-soft">{rule.text}</p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
