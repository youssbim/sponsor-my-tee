import { site } from "@/lib/config";

const LINKEDIN =
  "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z";
const X = "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z";

/** Floating LinkedIn and X buttons, bottom left on every page. */
export function SocialFabs() {
  const links = [
    { href: site.owner.x, label: "X @yourhandle", path: X },
    { href: site.owner.linkedin, label: "LinkedIn", path: LINKEDIN },
  ];
  return (
    <nav aria-label="Social" className="fixed bottom-4 left-4 z-30 flex flex-col gap-2">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener"
          aria-label={l.label}
          title={l.label}
          className="grid size-12 place-items-center rounded-full bg-ink text-paper shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] transition-transform hover:-translate-y-0.5 hover:scale-105"
        >
          <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
            <path fill="currentColor" d={l.path} />
          </svg>
        </a>
      ))}
    </nav>
  );
}
