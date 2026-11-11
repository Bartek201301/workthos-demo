import type { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/header/dashboard-header";
import { DashboardView } from "@/components/dashboard/view/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Real numbers and charts from two builds run with workthos: HackWin and workthos.",
};

export default function DashboardPage() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <DashboardHeader />
      <DashboardView />
    </main>
  );
}
