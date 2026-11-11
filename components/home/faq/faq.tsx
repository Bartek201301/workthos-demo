import { Reveal } from "@/components/brand";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// The first four are fixed by the issue; the last two come from docs/prd.md.
export const faqItems = [
  { question: "Do I need an organization repo?", answer: "No." },
  { question: "Which models?", answer: "The lead picks Sonnet or Opus per task." },
  { question: "Does it work with Codex?", answer: "Not in version 1." },
  { question: "What if a builder goes outside its task?", answer: "The hook blocks it, and the machine rejects the PR." },
  { question: "Who merges the pull requests?", answer: "Only the machine merges. No model merges." },
  { question: "Where do the numbers on this site come from?", answer: "From the real data of two builds, HackWin and workthos. Nothing is invented." },
] as const;

// The shadcn trigger hides the outline and draws a faint 50% ring on focus.
// Put back the global forest outline of app/globals.css (2 px, offset 2 px)
// and drop the ring. Better fixed in components/ui/accordion.tsx, which is
// outside this task's paths.
const triggerClass =
  "py-4 text-base font-semibold sm:text-lg focus-visible:border-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:ring-0";

/** Home section 8 (docs/prd.md): five or six short questions. */
export function Faq() {
  return (
    <section id="faq" className="bg-sand-100">
      <div className="mx-auto max-w-content px-4 py-section-mobile sm:px-6 md:py-section">
        <Reveal>
          <h2 className="font-display text-section leading-none font-extrabold tracking-display uppercase">FAQ</h2>
          <Accordion className="mt-8 max-w-3xl">
            {faqItems.map((item) => (
              <AccordionItem key={item.question} value={item.question} className="border-sand-200">
                <AccordionTrigger className={triggerClass}>{item.question}</AccordionTrigger>
                <AccordionContent keepMounted className="text-base text-ink-soft">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
