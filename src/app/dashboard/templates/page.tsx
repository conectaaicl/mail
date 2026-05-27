"use client";

import { useState, useEffect, useRef } from "react";
import { PlusIcon, LayoutTemplateIcon, PenIcon, TrashIcon, XIcon, CheckIcon, EyeIcon, CodeIcon, ImageIcon, TypeIcon, LinkIcon, AlignLeftIcon, BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";

interface Template { id: string; name: string; subject: string; htmlContent: string; textContent?: string; createdAt: string; }

const STARTER_TEMPLATES = [
  {
    name: "bienvenida",
    subject: "¡Bienvenido a {{ app_name }}!",
    html: `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px 32px;text-align:center">
    <h1 style="color:white;margin:0;font-size:28px;font-weight:800">¡Bienvenido, {{ nombre }}! 🎉</h1>
    <p style="color:rgba(255,255,255,0.8);margin:12px 0 0">Tu cuenta en {{ app_name }} está lista</p>
  </div>
  <div style="padding:32px;background:#1a1a2e">
    <p style="color:#e2e8f0;font-size:16px;line-height:1.6">Hola <strong style="color:#818cf8">{{ nombre }}</strong>,</p>
    <p style="color:#94a3b8;line-height:1.6">Tu cuenta ha sido creada exitosamente. Ahora puedes acceder a todas las funcionalidades.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="{{ login_url }}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px">Iniciar sesión →</a>
    </div>
    <p style="color:#475569;font-size:13px;text-align:center">Si no creaste esta cuenta, ignora este correo.</p>
  </div>
</div>`
  },
  {
    name: "credenciales",
    subject: "Tus credenciales de acceso — {{ app_name }}",
    html: `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#0f766e,#0284c7);padding:40px 32px;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px;font-weight:800">🔐 Tus credenciales de acceso</h1>
  </div>
  <div style="padding:32px;background:#1a1a2e">
    <p style="color:#e2e8f0">Hola <strong style="color:#34d399">{{ nombre }}</strong>, aquí están tus datos:</p>
    <div style="background:#0f172a;border:1px solid #1e293b;border-left:4px solid #0284c7;border-radius:10px;padding:20px;margin:20px 0">
      <p style="margin:0 0 10px;color:#94a3b8"><span style="color:#64748b">Email:</span> <strong style="color:#e2e8f0">{{ email }}</strong></p>
      <p style="margin:0;color:#94a3b8"><span style="color:#64748b">Contraseña:</span> <code style="background:#1e293b;padding:4px 10px;border-radius:6px;color:#34d399;font-size:15px">{{ password }}</code></p>
    </div>
    <p style="color:#ef4444;font-size:13px">⚠️ Cambia tu contraseña después del primer inicio de sesión.</p>
    <div style="text-align:center;margin-top:24px">
      <a href="{{ login_url }}" style="display:inline-block;background:linear-gradient(135deg,#0f766e,#0284c7);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700">Iniciar sesión →</a>
    </div>
  </div>
</div>`
  }
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Template | null>(null);
  const [loading, setLoading]     = useState(false);
  const [preview, setPreview]     = useState<Template | null>(null);
  const [viewMode, setViewMode]   = useState<"visual"|"code">("visual");
  const [name, setName]           = useState("");
  const [subject, setSubject]     = useState("");
  const [htmlContent, setHtml]    = useState("");
  const [textContent, setText]    = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  async function loadTemplates() {
    const res = await fetch("/api/templates");
    const data = await res.json();
    setTemplates(data.templates || []);
  }

  useEffect(() => { loadTemplates(); }, []);

  function openCreate(starter?: typeof STARTER_TEMPLATES[0]) {
    setEditing(null);
    setName(starter?.name || "");
    setSubject(starter?.subject || "");
    setHtml(starter?.html || "");
    setText("");
    setShowForm(true);
  }

  function openEdit(tpl: Template) {
    setEditing(tpl);
    setName(tpl.name);
    setSubject(tpl.subject);
    setHtml(tpl.htmlContent);
    setText(tpl.textContent || "");
    setShowForm(true);
  }

  async function handleSave() {
    if (!name || !subject || !htmlContent) return;
    setLoading(true);
    const url    = editing ? `/api/templates/${editing.id}` : "/api/templates";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, subject, htmlContent, textContent }) });
    await loadTemplates();
    setShowForm(false);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    await loadTemplates();
  }

  function insertSnippet(snippet: string) {
    setHtml(prev => prev + snippet);
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-end justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold mb-3 tracking-widest uppercase">
            <LayoutTemplateIcon size={12} /> Templates Engine
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white">Templates</h2>
          <p className="text-zinc-400 text-sm mt-1.5">Plantillas HTML con variables <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-violet-300 text-xs">{"{{ variable }}"}</code></p>
        </div>
        <button onClick={() => openCreate()} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]">
          <PlusIcon size={16} /> Nuevo template
        </button>
      </div>

      {/* Starter templates */}
      <div>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Plantillas de inicio rápido</p>
        <div className="flex gap-3">
          {STARTER_TEMPLATES.map(s => (
            <button key={s.name} onClick={() => openCreate(s)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-violet-500/50 rounded-xl text-sm text-zinc-300 hover:text-white transition-all">
              <LayoutTemplateIcon size={14} className="text-violet-400" />
              {s.name === "bienvenida" ? "Bienvenida" : "Credenciales"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map(tpl => (
          <div key={tpl.id} className="group flex flex-col bg-[#0F1115] border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-violet-500/40 hover:-translate-y-1 transition-all duration-300 shadow-xl">
            <div className="h-40 relative bg-zinc-900/50 overflow-hidden">
              <div className="absolute inset-0 scale-[0.35] origin-top-left w-[286%] h-[286%] pointer-events-none overflow-hidden">
                <div dangerouslySetInnerHTML={{ __html: tpl.htmlContent }} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F1115]/80" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[#0A0C10]/70 flex items-center justify-center gap-3 transition-opacity duration-200 backdrop-blur-sm">
                <button onClick={() => setPreview(tpl)} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors" title="Vista previa"><EyeIcon size={16} /></button>
                <button onClick={() => openEdit(tpl)} className="p-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full transition-colors" title="Editar"><PenIcon size={16} /></button>
                <button onClick={() => handleDelete(tpl.id)} className="p-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full transition-colors" title="Eliminar"><TrashIcon size={16} /></button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-white truncate">{tpl.name}</h3>
              <p className="text-xs text-zinc-500 truncate mt-0.5">Asunto: <span className="text-zinc-400">{tpl.subject}</span></p>
              <p className="text-[10px] text-zinc-700 mt-2 font-mono">...{tpl.id.slice(-8)}</p>
            </div>
          </div>
        ))}

        <button onClick={() => openCreate()} className="flex flex-col items-center justify-center bg-[#0F1115] border-2 border-dashed border-zinc-800 rounded-2xl hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group min-h-[200px]">
          <div className="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-violet-600 flex items-center justify-center transition-all mb-2">
            <PlusIcon size={22} className="text-zinc-400 group-hover:text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-500 group-hover:text-white transition-colors">Crear template</span>
        </button>
      </div>

      {/* Editor Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D0F14] border border-zinc-800 rounded-2xl w-full max-w-5xl shadow-2xl max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
              <h3 className="font-bold text-white text-lg">{editing ? "Editar template" : "Nuevo template"}</h3>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white transition-colors p-1"><XIcon size={20} /></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Meta fields */}
              <div className="px-6 py-4 border-b border-zinc-800/50 flex gap-4 flex-shrink-0">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Nombre del template</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="bienvenida_usuario"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Asunto del correo</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Bienvenido a {{ app_name }}"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                </div>
              </div>

              {/* Editor toolbar */}
              <div className="px-6 py-2 border-b border-zinc-800/50 flex items-center gap-2 flex-shrink-0 flex-wrap">
                <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 mr-2">
                  <button onClick={() => setViewMode("visual")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === "visual" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}>
                    <EyeIcon size={12} className="inline mr-1" />Visual
                  </button>
                  <button onClick={() => setViewMode("code")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === "code" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}>
                    <CodeIcon size={12} className="inline mr-1" />HTML
                  </button>
                </div>
                <div className="h-4 w-px bg-zinc-800" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mr-1">Insertar:</span>
                <button onClick={() => insertSnippet('\n<img src="URL_IMAGEN" alt="Logo" style="max-width:200px;display:block;margin:0 auto" />')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors">
                  <ImageIcon size={12} /> Imagen
                </button>
                <button onClick={() => insertSnippet('\n<a href="{{ login_url }}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">Botón →</a>')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors">
                  <LinkIcon size={12} /> Botón
                </button>
                <button onClick={() => insertSnippet('\n<h2 style="color:#e2e8f0;font-size:20px;font-weight:700">Título</h2>')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors">
                  <TypeIcon size={12} /> Título
                </button>
                <button onClick={() => insertSnippet('\n<p style="color:#94a3b8;line-height:1.6">Párrafo de texto aquí...</p>')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors">
                  <AlignLeftIcon size={12} /> Párrafo
                </button>
                <button onClick={() => insertSnippet('\n<hr style="border:none;border-top:1px solid #1e293b;margin:20px 0" />')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors">
                  Divider
                </button>
                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-zinc-500">
                  Variables disponibles:
                  {["{{ nombre }}", "{{ email }}", "{{ app_name }}", "{{ login_url }}", "{{ password }}"].map(v => (
                    <button key={v} onClick={() => setHtml(p => p + v)}
                      className="px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded font-mono hover:bg-violet-500/20 transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor + Preview */}
              <div className="flex-1 overflow-hidden flex min-h-0">
                {/* Code editor */}
                <div className={`flex flex-col ${viewMode === "visual" ? "w-1/2 border-r border-zinc-800/50" : "w-full"}`}>
                  <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/30 flex items-center gap-2">
                    <CodeIcon size={12} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Editor HTML</span>
                  </div>
                  <textarea value={htmlContent} onChange={e => setHtml(e.target.value)}
                    className="flex-1 bg-[#0A0C10] text-zinc-300 text-xs font-mono p-4 resize-none focus:outline-none leading-relaxed"
                    placeholder={"<div style=\"background:#111;padding:32px\">\n  <h1 style=\"color:white\">Hola {{ nombre }}</h1>\n</div>"} />
                </div>

                {/* Live preview */}
                {viewMode === "visual" && (
                  <div className="w-1/2 flex flex-col">
                    <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/30 flex items-center gap-2">
                      <EyeIcon size={12} className="text-zinc-500" />
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Preview en tiempo real</span>
                    </div>
                    <div className="flex-1 overflow-auto bg-zinc-100">
                      <iframe srcDoc={htmlContent || "<div style='padding:32px;color:#666;font-family:sans-serif'>El preview aparece aquí...</div>"}
                        className="w-full h-full border-0 min-h-[400px]" title="Preview" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-zinc-500">Las variables <code className="text-violet-400">{"{{ variable }}"}</code> se reemplazan al enviar</p>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button onClick={handleSave} disabled={loading || !name || !subject || !htmlContent}
                  className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all hover:shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                  <CheckIcon size={14} /> {loading ? "Guardando..." : "Guardar template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D0F14] border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
              <div>
                <h3 className="font-bold text-white">{preview.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Asunto: {preview.subject}</p>
              </div>
              <button onClick={() => setPreview(null)} className="text-zinc-500 hover:text-white"><XIcon size={20} /></button>
            </div>
            <div className="flex-1 overflow-auto bg-zinc-100 rounded-b-2xl">
              <iframe srcDoc={preview.htmlContent} className="w-full min-h-[500px] border-0" title="Preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
