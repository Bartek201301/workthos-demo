import { Reveal, Robot } from "@/components/brand";
import { site } from "@/lib/site";
import { InstallBox } from "./install-box";

/** Home section 9 (docs/prd.md): the install command, the repository link, a sleeping robot. */
export function Install() {
  return (
    <section id="install" className="mx-auto max-w-content px-4 py-section-mobile sm:px-6 md:py-section">
      <Reveal>
        <h2 className="font-display text-section leading-none font-extrabold tracking-display uppercase">Install</h2>
        <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <InstallBox />
            <p className="mt-6">
              <a href={site.repositoryUrl} className="font-semibold text-forest underline underline-offset-4">
                workthos on GitHub
              </a>
            </p>
          </div>
          {/*
            BotAvatar draws a quarter of its size past each side of its box
            (room for a hop or a flip). px-10 is that quarter of 160 px, so the
            drawing stays inside the column and never widens the page.
          */}
          <div className="self-center px-10">
            <Robot role="builder" state="sleeping" size={160} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
