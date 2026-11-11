import { Reveal, Robot, type RobotRole } from "@/components/brand";

// docs/prd.md: four robots here, one per step, each working since it is the one acting.
const steps: { title: string; role: RobotRole; text: string; note?: string }[] = [
  { title: "Plan", role: "lead", text: "You and the lead cut the work into tasks. Every file gets an owner." },
  { title: "Build", role: "builder", text: "Builders work in parallel: one task, one worktree, one PR each." },
  { title: "Review", role: "lead", text: "The lead reviews each PR and approves one exact commit." },
  {
    title: "Merge",
    role: "machine",
    text: "No model merges. The machine runs the tests and merges only what the lead approved.",
    note: "this one merges",
  },
];

/** Home section 3 (docs/prd.md): the loop in four steps, each with its robot. */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-content px-4 py-section-mobile sm:px-6 md:py-section">
      <Reveal>
        <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">The loop</p>
        <h2 className="font-display text-section leading-none font-extrabold tracking-display uppercase">
          How it works
        </h2>
        <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col rounded-card border-2 border-sand-200 bg-sand-50 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <Robot role={step.role} state="working" size={88} />
                <span
                  aria-hidden="true"
                  className="rounded-pill bg-lilac px-3 py-1 text-xs font-semibold tracking-wide text-ink uppercase"
                >
                  Step {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-6 font-display text-3xl leading-none font-extrabold tracking-display uppercase">
                {step.title}
              </h3>
              <p className="mt-3 text-ink-soft">{step.text}</p>
              {step.note && <p className="mt-auto pt-4 font-hand text-xl text-plum">{step.note}</p>}
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
