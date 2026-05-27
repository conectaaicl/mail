"use client";

import { useState, useEffect } from "react";
import { InboxIcon, RefreshCwIcon, MailOpenIcon, ChevronLeftIcon } from "lucide-react";

interface Email { id: string; from: string; subject: string; bodyText: string | null; bodyHtml: string | null; createdAt: string; status: string; }

export default function InboxPage() {
  const [emails, setEmails]     = useState<Email[]>([]);
  const [selected, setSelected] = useState<Email | null>(null);
  const [loading, setLoading]   = useState(true);

  async function loadEmails() {
    setLoading(true);
    const res = await fetch("/api/inbox");
    const d = await res.json();
    setEmails(d.emails || []);
    setLoading(false);
  }

  useEffect(() => { loadEmails(); }, []);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Bandeja de entrada</h2>
          <p className="text-zinc-400 text-sm mt-1">{emails.length} correo{emails.length !== 1 ? "s" : ""} recibido{emails.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={loadEmails} className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">
          <RefreshCwIcon size={14} className={loading ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Email list */}
        <div className={`flex flex-col bg-[#0F1115] border border-zinc-800/50 rounded-2xl overflow-hidden shadow-xl ${selected ? 'hidden lg:flex lg:w-80 flex-shrink-0' : 'w-full'}`}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <RefreshCwIcon size={20} className="animate-spin mr-2" /> Cargando...
            </div>
          ) : emails.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
              <InboxIcon size={40} className="mb-3 opacity-30" />
              <p className="text-base font-medium text-zinc-400">Sin correos aún</p>
              <p className="text-sm mt-1">Los correos entrantes aparecerán aquí.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50 overflow-y-auto flex-1">
              {emails.map(email => (
                <button key={email.id} onClick={() => setSelected(email)}
                  className={`w-full text-left flex items-start gap-3 p-4 hover:bg-zinc-800/30 transition-colors ${selected?.id === email.id ? 'bg-zinc-800/50 border-l-2 border-indigo-400' : ''}`}>
                  <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm flex-shrink-0 mt-0.5">
                    {email.from.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-white truncate">{email.from}</p>
                      <p className="text-[10px] text-zinc-500 flex-shrink-0">{new Date(email.createdAt).toLocaleDateString('es-CL')}</p>
                    </div>
                    <p className="text-sm text-zinc-300 truncate mt-0.5">{email.subject}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{email.bodyText?.slice(0, 80) || "Sin contenido"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Email detail */}
        {selected && (
          <div className="flex-1 flex flex-col bg-[#0F1115] border border-zinc-800/50 rounded-2xl overflow-hidden shadow-xl min-w-0">
            <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="lg:hidden text-zinc-400 hover:text-white transition-colors">
                <ChevronLeftIcon size={20} />
              </button>
              <MailOpenIcon size={16} className="text-indigo-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold truncate">{selected.subject}</p>
                <p className="text-zinc-500 text-xs truncate">De: {selected.from}</p>
              </div>
              <p className="text-xs text-zinc-500 flex-shrink-0">{new Date(selected.createdAt).toLocaleString('es-CL')}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {selected.bodyHtml ? (
                <div className="bg-white rounded-xl overflow-hidden">
                  <iframe srcDoc={selected.bodyHtml} className="w-full min-h-[400px] border-0" title="Email content" />
                </div>
              ) : (
                <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{selected.bodyText || "Sin contenido"}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
