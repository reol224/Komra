import { Shield } from "lucide-react";
import type { ReactNode } from "react";

export default function DashboardSidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="shrink-0 bg-[#10102f] text-white md:min-h-screen md:w-60">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600">
          <Shield className="h-5 w-5" />
        </div>
        <span className="text-xl font-semibold tracking-tight">Komra</span>
      </div>
      {children}
    </aside>
  );
}
