"use client";

import { useState, useEffect } from "react";
import { SendIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon } from "lucide-react";

interface Domain { id: string; name: string; }
interface Email { id: string; subject: string; to: string; from: string; status: string; createdAt: string; }

const statusStyle: Record<string, string> = {
  SENT:      "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  DELIVERED: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  FAILED:    "text-red-400 bg-red-400/10 border-red-400/20",
  BOUNCED:   "text-orange-400 bg-orange-400/10 border-orange-400/20",
  PENDING:   "text-zinc-400 bg-zinc-400/10 border-zinc-700",
};

const PREFIXES = ["hello", "soporte", "ventas", "contacto", "info", "admin", "no-reply"];

export default function OutboxPage() {
  const [domains, setDomains]   = useState<Domain[]>([]);
  const [emails, setEmails]     = useState<Email[]>([]);
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState<"idle"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/outbox/data").then(r => r.json()).then(d => {
      setDomains(d.domains || []);
      setEmails(d.emails || []);
    });
  }, []);

  const addressOptions = domains.flatMap(d =>
    PREFIXES.map(p => ({ label: `${p}@${d.name}`, value: `${p}@${d.name}` }))
  );

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/outbox/send", {
      method: "POST",
      body: JSON.stringify({ from: form.get("from"), to: form.get("to"), subject: form.get("subject"), message: form.get("message") }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("success");
      (e.target as HTMLFormElement).reset();
      fetch("/api/outbox/data").then(r => r.json()).then(d => setEmails(d.emails || []));
    } else {
      setStatus("error");
      setErrorMsg(data.error || "Error desconocido");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Enviar Correo</h2>
        <p className="text-zinc-400 text-sm mt-1">Redacta y envía desde tus dominios verificados.</p>
      </div>
      <div className="bg-[#0F1115] border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center gap-2">
          <SendIcon size={16} className="text-indigo-400" />
          <span className="text-sm font-bold text-white">Nuevo mensaje</span>
        </div>
        <form onSubmit={handleSend} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">De</label>
              <select name="from" className="w-full bg-[#0A0C10] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {addressOptions.length > 0
                  ? addressOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                  : <option value="">— Configura un dominio primero —</option>}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Para</label>
              <input name="to" type="email" required placeholder="destinatario@gmail.com"
                className="w-full bg-[#0A0C10] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Asunto</label>
            <input name="subject" type="text" required placeholder="Tu factura está lista"
              className="w-full bg-[#0A0C10] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Mensaje</label>
            <textarea name="message" required rows={7} placeholder="Escribe tu mensaje aquí..."
              className="w-full bg-[#0A0C10] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y" />
          </div>
          {status === "success" && (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-4 py-3 rounded-lg text-sm font-medium">
              <CheckCircleIcon size={16} /> Correo enviado exitosamente
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-lg text-sm font-medium">
              <XCircleIcon size={16} /> Error: {errorMsg}
            </div>
          )}
          <div className="pt-2 flex justify-end">
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">
              {loading ? <><RefreshCwIcon size={14} className="animate-spin" /> Enviando...</> : <><SendIcon size={14} /> Enviar</>}
            </button>
          </div>
        </form>
      </div>
      {emails.length > 0 && (
        <div className="bg-[#0F1115] border border-zinc-800/50 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800/50">
            <h3 className="text-sm font-bold text-white">Enviados recientes</h3>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {emails.map(email => (
              <div key={email.id} className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-zinc-800/20 transition-colors">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-zinc-100 truncate block">{email.subject}</span>
                  <span className="text-zinc-500 text-xs">{email.from} → {email.to}</span>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span className="text-zinc-600 text-xs">{new Date(email.createdAt).toLocaleDateString('es-CL')}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusStyle[email.status] || "text-zinc-400"}`}>
                    {email.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
