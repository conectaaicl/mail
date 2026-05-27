"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InboxIcon, SendIcon, GlobeIcon, SettingsIcon, LayoutDashboardIcon, LogOutIcon, LayoutTemplateIcon, MenuIcon, XIcon } from "lucide-react";
import { ReactNode, useState } from "react";
import { signOut } from "next-auth/react";

export default function Sidebar({ userName, userEmail, initials }: { userName: string, userEmail: string, initials: string }) {
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  const sidebarClasses = mobileOpen
    ? "flex flex-col z-40 transition-transform duration-300 md:w-64 fixed inset-y-0 left-0 w-72 translate-x-0"
    : "flex flex-col z-40 transition-transform duration-300 md:w-64 fixed inset-y-0 left-0 w-72 -translate-x-full md:translate-x-0 md:static";

  return (
    <>
      {/* Mobile hamburger — visible only on small screens */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-white/10 text-zinc-300"
        aria-label="Menu"
      >
        {mobileOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={sidebarClasses} style={{ background: "#0F1520", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="h-16 flex items-center px-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.35)]">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">ConectaAI</span>
              <span className="block text-[10px] text-indigo-400 font-semibold tracking-[0.2em] uppercase -mt-0.5">Mail</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2">General</div>
            <SidebarItem href="/dashboard" icon={<LayoutDashboardIcon size={17} />} label="Inicio" pathname={pathname} />
          </div>
          <div>
            <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2">Correos</div>
            <SidebarItem href="/dashboard/inbox" icon={<InboxIcon size={17} />} label="Bandeja de entrada" pathname={pathname} />
            <SidebarItem href="/dashboard/outbox" icon={<SendIcon size={17} />} label="Enviar correo" pathname={pathname} />
            <SidebarItem href="/dashboard/templates" icon={<LayoutTemplateIcon size={17} />} label="Templates" pathname={pathname} />
          </div>
          <div>
            <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2">Configuración</div>
            <SidebarItem href="/dashboard/domains" icon={<GlobeIcon size={17} />} label="Dominios" pathname={pathname} />
            <SidebarItem href="/dashboard/settings" icon={<SettingsIcon size={17} />} label="Preferencias" pathname={pathname} />
          </div>
        </nav>

        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[2px] shadow-lg">
              <div className="w-full h-full rounded-full bg-[#0F1520] flex items-center justify-center text-xs font-bold text-white">{initials}</div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-sm text-white truncate">{userName}</p>
              <p className="text-zinc-400 text-[11px] truncate">{userEmail}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-red-500/10 rounded-xl transition-all text-zinc-400 hover:text-red-400">
            <LogOutIcon size={17} />
            <span className="text-sm font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarItem({ href, icon, label, badge, pathname }: { href: string; icon: ReactNode; label: string; badge?: string; pathname: string }) {
  const active = pathname === href;
  return (
    <Link href={href}
      className={"flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden mb-0.5 " + (active ? "text-white" : "text-zinc-400 hover:text-white")}
      style={active ? { background: "rgba(99,102,241,0.15)", borderLeft: "2px solid #818cf8" } : {}}>
      {!active && <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(255,255,255,0.04)" }} />}
      <div className="flex items-center gap-3 relative z-10">
        <div className={"transition-colors " + (active ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")}>{icon}</div>
        {label}
      </div>
      {badge && <span className="relative z-10 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">{badge}</span>}
    </Link>
  );
}
