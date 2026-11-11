import Link from "next/link";
import { site } from "@/lib/site";

const links = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Dashboard", href: "/dashboard" },
] as const;

const linkClass =
  "rounded-pill px-1 py-1 underline-offset-4 transition-colors hover:text-forest hover:underline";

export function SiteNav() {
  return (
    <header className="border-b-2 border-dashed border-sand-200">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="rounded-md font-display text-2xl font-extrabold tracking-display uppercase"
        >
          {site.name}
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold tracking-wide uppercase sm:gap-x-6">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={site.repositoryUrl} className={linkClass}>
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
