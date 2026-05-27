"use client";

import { useState, useEffect } from "react";
import { KeyIcon, ShieldCheckIcon, CopyIcon, Code2Icon, WebhookIcon, CreditCardIcon, PlusIcon, TrashIcon, CheckIcon, XIcon, EyeIcon, EyeOffIcon } from "lucide-react";

interface ApiKey { id: string; name: string; key: string; lastUsed: string | null; createdAt: string; }
interface Webhook { id: string; url: string; events: string; createdAt: string; }

export default function SettingsPage() {
  const [tab, setTab]           = useState("apikeys");
  const [apiKeys, setApiKeys]   = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [copied, setCopied]     = useState<string | null>(null);
  const [showKey, setShowKey]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  // Password change state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass]         = useState("");
  const [passMsg, setPassMsg]         = useState<{type:"ok"|"err", text:string} | null>(null);

  // Webhook form
  const [webhookUrl, setWebhookUrl]       = useState("");
  const [webhookEvents, setWebhookEvents] = useState("send,bounce,open");

  useEffect(() => { loadKeys(); loadWebhooks(); }, []);

  async function loadKeys() {
    const res = await fetch("/api/settings/apikeys");
    const d = await res.json();
    setApiKeys(d.apiKeys || []);
  }

  async function loadWebhooks() {
    const res = await fetch("/api/settings/webhooks");
    const d = await res.json();
    setWebhooks(d.webhooks || []);
  }

  async function generateKey() {
    setLoading(true);
    await fetch("/api/settings/apikeys", { method: "POST" });
    await loadKeys();
    setLoading(false);
  }

  async function deleteKey(id: string) {
    if (!confirm("¿Revocar esta API key?")) return;
    await fetch(`/api/settings/apikeys/${id}`, { method: "DELETE" });
    await loadKeys();
  }

  async function saveWebhook() {
    if (!webhookUrl) return;
    setLoading(true);
    await fetch("/api/settings/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, events: webhookEvents }),
    });
    await loadWebhooks();
    setWebhookUrl("");
    setLoading(false);
  }

  async function deleteWebhook(id: string) {
    await fetch(`/api/settings/webhooks/${id}`, { method: "DELETE" });
    await loadWebhooks();
  }

  async function changePassword() {
    setPassMsg(null);
    if (!currentPass || !newPass) return;
    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
    });
    const d = await res.json();
    if (res.ok) { setPassMsg({ type: "ok", text: "Contraseña actualizada" }); setCurrentPass(""); setNewPass(""); }
    else setPassMsg({ type: "err", text: d.error || "Error al cambiar contraseña" });
  }

  function copyKey(key: string, id: string) {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const tabs = [
    { id: "apikeys",  icon: <KeyIcon size={16} />,        title: "API Keys",  desc: "Claves de acceso" },
    { id: "webhooks", icon: <WebhookIcon size={16} />,    title: "Webhooks",  desc: "Eventos salientes" },
    { id: "security", icon: <ShieldCheckIcon size={16} />, title: "Seguridad", desc: "Contraseña" },
    { id: "billing",  icon: <CreditCardIcon size={16} />, title: "Billing",   desc: "Plan actual" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Tab nav */}
      <div className="w-full lg:w-60 flex-shrink-0 space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-6">Configuración</h2>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`w-full p-4 rounded-xl text-left transition-all border ${tab === t.id ? 'bg-zinc-800/80 border-zinc-700 shadow-lg' : 'border-transparent hover:bg-zinc-900/50'}`}>
            <div className="flex items-center gap-3">
              <div className={tab === t.id ? 'text-indigo-400' : 'text-zinc-500'}>{t.icon}</div>
              <div>
                <h4 className={`text-sm font-bold ${tab === t.id ? 'text-white' : 'text-zinc-300'}`}>{t.title}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">{t.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6">

        {/* API Keys */}
        {tab === "apikeys" && (
          <div className="p-7 rounded-2xl border border-zinc-800/50 bg-[#0F1115] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><KeyIcon size={20} className="text-indigo-400" /> API Keys</h3>
            <p className="text-sm text-zinc-400 mb-6">Usa estas claves para enviar correos desde tus otros SaaS.</p>
            <div className="space-y-4 mb-6">
              {apiKeys.length === 0 ? (
                <div className="text-zinc-500 p-4 border border-dashed border-zinc-800 rounded-lg text-center text-sm">No tienes API keys. Genera una.</div>
              ) : apiKeys.map(key => (
                <div key={key.id} className="bg-[#0A0C10] border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg"><KeyIcon size={18} /></div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-bold text-sm">{key.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="font-mono text-zinc-400 text-xs bg-zinc-900 border border-zinc-800 px-2 py-1 rounded truncate max-w-xs">
                          {showKey === key.id ? key.key : key.key.slice(0, 12) + "••••••••••••••••••••"}
                        </code>
                        <button onClick={() => setShowKey(showKey === key.id ? null : key.id)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                          {showKey === key.id ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                        </button>
                        <button onClick={() => copyKey(key.key, key.id)} className="text-zinc-500 hover:text-white transition-colors">
                          {copied === key.id ? <CheckIcon size={14} className="text-emerald-400" /> : <CopyIcon size={14} />}
                        </button>
                      </div>
                      {key.lastUsed && <p className="text-[10px] text-zinc-600 mt-1">Último uso: {new Date(key.lastUsed).toLocaleDateString('es-CL')}</p>}
                    </div>
                  </div>
                  <button onClick={() => deleteKey(key.id)} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-semibold transition-colors flex-shrink-0">
                    <TrashIcon size={14} /> Revocar
                  </button>
                </div>
              ))}
            </div>
            <button onClick={generateKey} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-sm font-bold text-indigo-400 hover:bg-indigo-500/20 transition-colors disabled:opacity-50">
              <PlusIcon size={16} /> {loading ? "Generando..." : "Nueva API Key"}
            </button>

            {/* Usage example */}
            <div className="mt-8 p-5 bg-[#0A0C10] rounded-xl border border-zinc-800">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Code2Icon size={14} /> Ejemplo de uso</p>
              <pre className="text-xs font-mono text-zinc-300 overflow-x-auto leading-loose">
{`curl -X POST https://mail.conectaai.cl/api/send/welcome \\
  -H "Authorization: Bearer ${apiKeys[0]?.key || "sk_live_..."}" \\
  -H "Content-Type: application/json" \\
  -d '{"to":"usuario@gmail.com","name":"Juan","app_name":"FixHub"}'`}
              </pre>
            </div>
          </div>
        )}

        {/* Webhooks */}
        {tab === "webhooks" && (
          <div className="p-7 rounded-2xl border border-zinc-800/50 bg-[#0F1115] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><WebhookIcon size={20} className="text-indigo-400" /> Webhooks</h3>
            <p className="text-sm text-zinc-400 mb-6">Recibe notificaciones en tu servidor cuando ocurran eventos de correo.</p>
            <div className="space-y-3 mb-6">
              {webhooks.length === 0 ? (
                <div className="text-zinc-500 p-4 border border-dashed border-zinc-800 rounded-lg text-center text-sm">No tienes webhooks configurados.</div>
              ) : webhooks.map(wh => (
                <div key={wh.id} className="bg-[#0A0C10] border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white text-sm font-mono">{wh.url}</p>
                    <p className="text-zinc-500 text-xs mt-1">Eventos: {wh.events}</p>
                  </div>
                  <button onClick={() => deleteWebhook(wh.id)} className="text-red-400 hover:text-red-300 transition-colors"><TrashIcon size={16} /></button>
                </div>
              ))}
            </div>
            <div className="space-y-3 p-5 bg-[#0A0C10] border border-zinc-800 rounded-xl">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Agregar webhook</p>
              <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://tu-servidor.com/webhook"
                className="w-full bg-[#0F1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <input value={webhookEvents} onChange={e => setWebhookEvents(e.target.value)} placeholder="send,bounce,open"
                className="w-full bg-[#0F1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <button onClick={saveWebhook} disabled={loading || !webhookUrl}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">
                <PlusIcon size={16} /> Agregar
              </button>
            </div>
          </div>
        )}

        {/* Security */}
        {tab === "security" && (
          <div className="p-7 rounded-2xl border border-zinc-800/50 bg-[#0F1115] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><ShieldCheckIcon size={20} className="text-indigo-400" /> Seguridad</h3>
            <p className="text-sm text-zinc-400 mb-6">Cambia tu contraseña de acceso.</p>
            <div className="max-w-md space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Contraseña actual</label>
                <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="••••••••"
                  className="w-full bg-[#0A0C10] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nueva contraseña</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#0A0C10] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              {passMsg && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${passMsg.type === "ok" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                  {passMsg.type === "ok" ? <CheckIcon size={16} /> : <XIcon size={16} />} {passMsg.text}
                </div>
              )}
              <button onClick={changePassword} disabled={!currentPass || !newPass}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">
                <ShieldCheckIcon size={16} /> Actualizar contraseña
              </button>
            </div>
          </div>
        )}

        {/* Billing */}
        {tab === "billing" && (
          <div className="p-7 rounded-2xl border border-zinc-800/50 bg-[#0F1115] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><CreditCardIcon size={20} className="text-indigo-400" /> Billing</h3>
            <p className="text-sm text-zinc-400 mb-8">Plan y uso actual.</p>
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-2xl p-6 max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Plan actual</span>
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">Self-hosted</span>
              </div>
              <h4 className="text-2xl font-extrabold text-white mb-1">Gratuito</h4>
              <p className="text-zinc-400 text-sm">Correos ilimitados vía tu propio SMTP.</p>
              <div className="mt-6 pt-6 border-t border-zinc-800 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-zinc-400">SMTP</span><span className="text-emerald-400 font-bold">Brevo conectado</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Almacenamiento</span><span className="text-white font-bold">SQLite local</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Templates</span><span className="text-white font-bold">Ilimitados</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
