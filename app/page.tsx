import { DayTimeline } from "@/components/home/day/day-timeline";
import { Faq } from "@/components/home/faq/faq";
import { Hero } from "@/components/home/hero/hero";
import { HowItWorks } from "@/components/home/how-it-works/how-it-works";
import { Install } from "@/components/home/install/install";
import { NumbersBand } from "@/components/home/numbers/numbers-band";
import { ProofTeaser } from "@/components/home/proof/proof-teaser";
import { Rules } from "@/components/home/rules/rules";
import { UiLane } from "@/components/home/ui-lane/ui-lane";

export default function HomePage() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Hero />
      <NumbersBand />
      <HowItWorks />
      <Rules />
      <UiLane />
      <DayTimeline />
      <ProofTeaser />
      <Faq />
      <Install />
    </main>
  );
}
