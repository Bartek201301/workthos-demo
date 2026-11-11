import type { Metadata } from "next";
import { Bricolage_Grotesque, Kalam, Manrope } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { SkipLink } from "@/components/layout/skip-link";
import { cn } from "@/lib/utils";
import "./globals.css";

// Bricolage Grotesque (700 to 800) and Manrope (400 to 600) are variable
// fonts: one file each covers those weights, fewer requests than one file per weight.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Kalam is only for small handwritten notes, so it is not preloaded.
const hand = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-hand",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "workthos: you plan, they build, the machine merges",
    template: "%s · workthos",
  },
  description:
    "workthos is an open source workflow to run many Claude Code sessions in parallel on one GitHub repository: a lead plans and reviews, builders work in their own worktrees, and a merge machine with no model merges only what was reviewed.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(display.variable, body.variable, hand.variable)}>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <SiteNav />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
