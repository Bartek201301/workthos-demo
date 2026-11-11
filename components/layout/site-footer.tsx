import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-plum text-sand-50">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>You plan. They build. The machine merges.</p>
        <a
          href={site.repositoryUrl}
          className="rounded-md font-semibold underline underline-offset-4 hover:text-lilac"
        >
          {site.name} on GitHub
        </a>
      </div>
    </footer>
  );
}
