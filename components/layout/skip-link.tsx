/** The first focusable element: hidden until it gets keyboard focus. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-pill bg-forest font-semibold text-sand-50 focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-5 focus:py-2"
    >
      Skip to content
    </a>
  );
}
