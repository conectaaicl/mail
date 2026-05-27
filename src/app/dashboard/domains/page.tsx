"use client";

import { useState, useEffect } from "react";
import { GlobeIcon, PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon, CopyIcon, ChevronDownIcon, ChevronUpIcon, MailIcon, ArrowRightIcon } from "lucide-react";

interface Domain { id: string; name: string; verified: boolean; createdAt: string; }

const DNS_RECORDS = (domain: string) => ([
  { type: "MX",  name: domain,       value: "feedback-smtp.sa-east-1.amazonses.com", priority: "10", ttl: "Auto", desc: "Recepción de correos (Brevo inbound)" },
  { type: "TXT", name: domain,       value: `v=spf1 include:spf.brevo.com mx ~all`,  priority: "",   ttl: "Auto", desc: "SPF — autoriza a Brevo a enviar en tu nombre" },
  { type: "TXT", name: `brevo._domainkey.${domain}`, value: "k=rsa;p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDeMVIzrCa3T14JsNfSRIyEMDn...", priority: "", ttl: "Auto", desc: "DKIM — firma digital de correos (obtén el valor exacto en Brevo → Senders → Domains)" },
  { type: "CNAME", name: `mail.${domain}`, value: "opentracking.brevo.com", priority: "", ttl: "Auto", desc: "Tracking de aperturas (opcional)" },
]);

export default function DomainsPage() {
  const [domains, setDomains]       = useState<Domain[]>([]);
  const [loading, setLoading]       = useState(false);
  const [newDomain, setNewDomain]   = useState("");
  const [error, setError]           = useState("");
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [copied, setCopied]         = useState<string | null>(null);

  async function loadDomains() {
    const res = await fetch("/api/domains");
    const d = await res.json();
    setDomains(d.domains || []);
  }

  useEffect(() => { loadDomains(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: newDomain.trim().toLowerCase() }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error || "Error al agregar dominio"); }
    else { setNewDomain(""); await loadDomains(); setExpanded(d.domain?.id || null); }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar ${name}?`)) return;
    await fetch(`/api/domains/${id}`, { method: "DELETE" });
    await loadDomains();
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 uppercase tracking-wider" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8" }}>
          <GlobeIcon size={12} /> Dominios Remitentes
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-white">Dominios</h2>
        <p className="text-zinc-400 text-sm mt-1.5">Configura los dominios desde los cuales enviarás y recibirás correos.</p>
      </div>

      {/* Agregar dominio */}
      <div className="rounded-2xl p-6 shadow-xl" style={{ background: "#1A2235", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><PlusIcon size={16} className="text-indigo-400" /> Agregar dominio</h3>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input value={newDomain} onChange={e => setNewDomain(e.target.value)}
            placeholder="conectaai.cl" type="text"
            className="flex-1 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 rounded-xl focus:outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
            <PlusIcon size={14} /> {loading ? "Agregando..." : "Agregar"}
          </button>
        </form>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {/* Lista de dominios */}
      <div className="space-y-4">
        {domains.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: "#1A2235", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <GlobeIcon size={36} className="mx-auto mb-3 opacity-20 text-zinc-400" />
            <p className="text-zinc-400 font-medium">No tienes dominios configurados</p>
            <p className="text-zinc-600 text-sm mt-1">Agrega un dominio arriba para empezar a enviar correos</p>
          </div>
        ) : domains.map(domain => (
          <div key={domain.id} className="rounded-2xl overflow-hidden shadow-xl" style={{ background: "#1A2235", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Domain header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}>
                  <GlobeIcon size={16} className="text-indigo-400" />
                </div>
                <div>
                  <p className="font-bold text-white">{domain.name}</p>
                  <p className="text-zinc-500 text-xs">{new Date(domain.createdAt).toLocaleDateString("es-CL")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {domain.verified
                  ? <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}><CheckCircleIcon size={12} /> Verificado</span>
                  : <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}><XCircleIcon size={12} /> Pendiente DNS</span>
                }
                <button onClick={() => setExpanded(expanded === domain.id ? null : domain.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(99,102,241,0.1)" }}>
                  Ver DNS {expanded === domain.id ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
                </button>
                <button onClick={() => handleDelete(domain.id, domain.name)} className="text-red-400 hover:text-red-300 transition-colors p-1.5">
                  <TrashIcon size={15} />
                </button>
              </div>
            </div>

            {/* DNS Records Panel */}
            {expanded === domain.id && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-6 py-4" style={{ background: "rgba(0,0,0,0.2)" }}>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Registros DNS requeridos</p>
                  <p className="text-zinc-500 text-xs">Agrega estos registros en Cloudflare → DNS → Records para <strong className="text-zinc-300">{domain.name}</strong></p>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {DNS_RECORDS(domain.name).map((rec, i) => (
                    <div key={i} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-black px-2 py-0.5 rounded font-mono" style={{
                              background: rec.type === "MX" ? "rgba(251,146,60,0.15)" : rec.type === "TXT" ? "rgba(52,211,153,0.15)" : "rgba(99,102,241,0.15)",
                              color: rec.type === "MX" ? "#fb923c" : rec.type === "TXT" ? "#34d399" : "#818cf8",
                            }}>{rec.type}</span>
                            <span className="text-zinc-300 text-sm font-bold font-mono truncate">{rec.name}</span>
                            {rec.priority && <span className="text-zinc-500 text-xs">Prioridad: {rec.priority}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-zinc-400 font-mono break-all flex-1" style={{ background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: "6px" }}>
                              {rec.value}
                            </code>
                            <button onClick={() => copyText(rec.value, `${domain.id}-${i}`)}
                              className="text-zinc-500 hover:text-white transition-colors flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10">
                              {copied === `${domain.id}-${i}` ? <CheckCircleIcon size={14} className="text-emerald-400" /> : <CopyIcon size={14} />}
                            </button>
                          </div>
                          <p className="text-zinc-600 text-xs mt-1.5">{rec.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inbound config */}
                <div className="px-6 py-5 mx-4 mb-4 rounded-xl mt-2" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <MailIcon size={14} className="text-indigo-400" />
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Configurar correos entrantes (Brevo)</p>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                    Para recibir correos en la bandeja de entrada, configura el webhook inbound de Brevo:
                  </p>
                  <ol className="space-y-1.5 text-xs text-zinc-400 list-none">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">1.</span> Ve a <strong className="text-zinc-300">brevo.com → Settings → Inbound parsing</strong></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">2.</span> Agrega el dominio <strong className="text-zinc-300">{domain.name}</strong></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">3.</span> En Webhook URL pon:
                      <div className="flex items-center gap-1 ml-1">
                        <code className="text-indigo-300 font-mono" style={{ background: "rgba(99,102,241,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                          https://mail.conectaai.cl/api/webhooks/inbound
                        </code>
                        <button onClick={() => copyText("https://mail.conectaai.cl/api/webhooks/inbound", "inbound")}
                          className="text-zinc-500 hover:text-white transition-colors">
                          {copied === "inbound" ? <CheckCircleIcon size={12} className="text-emerald-400" /> : <CopyIcon size={12} />}
                        </button>
                      </div>
                    </li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">4.</span> Verifica el dominio con el registro MX de arriba</li>
                  </ol>
                  <a href="https://help.brevo.com/hc/en-us/articles/360007207Inbound" target="_blank" rel="noopener"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-3 transition-colors">
                    Ver guía completa de Brevo <ArrowRightIcon size={11} />
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
