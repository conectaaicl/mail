import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { BellIcon } from "lucide-react";
import { auth } from "@/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const userName = session?.user?.name || "Admin";
  const userEmail = session?.user?.email || "admin@conectaai.cl";
  const initials = userName.substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen text-zinc-100 font-sans selection:bg-indigo-500/30" style={{ background: "#141B2D" }}>
      <Sidebar userName={userName} userEmail={userEmail} initials={initials} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 relative z-10" style={{ background: "rgba(20,27,45,0.9)" }}>
          <div className="flex items-center text-sm font-medium text-zinc-400">
            <span className="hover:text-zinc-200 cursor-pointer transition-colors">Workspace</span>
            <span className="mx-2 text-zinc-600">/</span>
            <span className="text-zinc-200">Live Data Mode</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              REAL DB CONNECTED
            </div>
            <button className="text-zinc-400 hover:text-zinc-100 transition-colors relative">
              <BellIcon size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-indigo-500 border-2 border-[#141B2D]"></span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto relative z-10 p-4 md:p-8 pt-16 md:pt-4">
          {children}
        </div>
      </main>
    </div>
  );
}
