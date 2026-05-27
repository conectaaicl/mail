import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import Link from "next/link";
import {
  MailIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, ClockIcon,
  ActivityIcon, UsersIcon, GlobeIcon, KeyIcon, ArrowRightIcon,
  ServerIcon, ZapIcon, ShieldCheckIcon, DatabaseIcon, WifiIcon, BellIcon,
} from "lucide-react";

const prisma = new PrismaClient();

// ── System health checks ──────────────────────────────────────────────────────
async function getSystemStatus() {
  const checks = await Promise.allSettled([
    // 1. Database
    prisma.user.count().then(n => ({ name: "Base de datos SQLite", ok: true, detail: n + " usuarios", category: "infra" })),
    // 2. SMTP
    Promise.resolve({ name: "SMTP Brevo", ok: !!process.env.SMTP_HOST, detail: process.env.SMTP_HOST ? "smtp-relay.brevo.com:587" : "Sin configurar", category: "email" }),
    // 3. Domains
    prisma.domain.findMany().then(d => {
      const verified = d.filter(x => x.verified).length
      return { name: "Dominios DNS", ok: verified > 0, detail: verified + "/" + d.length + " verificados", category: "email" }
    }),
    // 4. API Keys
    prisma.apiKey.findMany().then(k => {
      const active = k.filter(x => !x.name.startsWith("webhook:"))
      return { name: "API Keys", ok: active.length > 0, detail: active.length + " activas", category: "auth" }
    }),
    // 5. Templates
    prisma.template.count().then(n => ({ name: "Templates email", ok: n > 0, detail: n + " templates", category: "email" })),
    // 6. n8n webhook
    Promise.resolve({ name: "n8n Webhook", ok: !!process.env.N8N_WEBHOOK_URL, detail: process.env.N8N_WEBHOOK_URL ? "Configurado" : "Sin configurar", category: "integrations" }),
    // 7. Resend / Mail provider
    Promise.resolve({ name: "Resend API", ok: !!process.env.RESEND_API_KEY, detail: process.env.RESEND_API_KEY ? "Key configurada" : "Sin configurar", category: "email" }),
    // 8. NextAuth
    Promise.resolve({ name: "Auth / NextAuth", ok: !!process.env.NEXTAUTH_SECRET, detail: "JWT activo", category: "auth" }),
    // 9. Social conectaai
    fetch("https://social.conectaai.cl/api/status", { signal: AbortSignal.timeout(4000) }).then(r => ({ name: "Social IA", ok: r.ok, detail: r.ok ? "Online" : "Error " + r.status, category: "ecosystem" })).catch(() => ({ name: "Social IA", ok: false, detail: "Sin respuesta", category: "ecosystem" })),
    // 10. OmniFlow
    fetch("https://osw.conectaai.cl/api/v1/health", { signal: AbortSignal.timeout(4000) }).then(r => ({ name: "OmniFlow CRM", ok: r.ok, detail: r.ok ? "Online" : "Error " + r.status, category: "ecosystem" })).catch(() => ({ name: "OmniFlow CRM", ok: false, detail: "Sin respuesta", category: "ecosystem" })),
    // 11. SEO
    fetch("https://seo.conectaai.cl/health", { signal: AbortSignal.timeout(4000) }).then(r => ({ name: "SEO API", ok: r.ok, detail: r.ok ? "Online" : "Error " + r.status, category: "ecosystem" })).catch(() => ({ name: "SEO API", ok: false, detail: "Sin respuesta", category: "ecosystem" })),
    // 12. TerraBlinds
    fetch("https://terrablinds.cl", { signal: AbortSignal.timeout(4000) }).then(r => ({ name: "TerraBlinds.cl", ok: r.ok, detail: r.ok ? "Online" : "Error " + r.status, category: "ecosystem" })).catch(() => ({ name: "TerraBlinds.cl", ok: false, detail: "Sin respuesta", category: "ecosystem" })),
    // 13. Workspaces
    prisma.workspace.count().then(n => ({ name: "Workspaces activos", ok: n > 0, detail: n + " workspaces", category: "infra" })),
  ])

  return checks.map((r, i) => {
    if (r.status === "fulfilled") return r.value as { name: string; ok: boolean; detail: string; category: string }
    return { name: "Check " + i, ok: false, detail: "Error interno", category: "infra" }
  })
}

function StatusDot({ ok, warn }: { ok: boolean; warn?: boolean }) {
  const color = ok ? "#22c55e" : warn ? "#f59e0b" : "#ef4444"
  return (
    <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, display: "inline-block", flexShrink: 0 }} />
  )
}

function SystemCard({ check }: { check: { name: string; ok: boolean; detail: string; category: string } }) {
  const catIcon: Record<string, typeof ServerIcon> = { infra: DatabaseIcon, email: MailIcon, auth: ShieldCheckIcon, integrations: ZapIcon, ecosystem: WifiIcon }
  const Icon = catIcon[check.category] ?? ServerIcon
  return (
    <div style={{ background: "#1A2235", border: `1px solid ${check.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.2)"}`, borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: check.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color={check.ok ? "#22c55e" : "#ef4444"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          <StatusDot ok={check.ok} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{check.name}</span>
        </div>
        <span style={{ fontSize: 11, color: "#64748b" }}>{check.detail}</span>
      </div>
      <div style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: check.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: check.ok ? "#22c55e" : "#ef4444", flexShrink: 0 }}>
        {check.ok ? "OK" : "ERROR"}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  let workspaceId = "";
  if (userId) {
    const member = await prisma.workspaceMember.findFirst({ where: { userId } });
    if (member) workspaceId = member.workspaceId;
  }

  const [totalEmails, deliveredCount, failedCount, bouncedCount, pendingCount, recentEmails, domains, templates, apiKeys, systemChecks] = await Promise.all([
    prisma.email.count({ where: { workspaceId } }),
    prisma.email.count({ where: { workspaceId, status: "DELIVERED" } }),
    prisma.email.count({ where: { workspaceId, status: "FAILED" } }),
    prisma.email.count({ where: { workspaceId, status: "BOUNCED" } }),
    prisma.email.count({ where: { workspaceId, status: "PENDING" } }),
    prisma.email.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.domain.findMany({ where: { workspaceId } }),
    prisma.template.findMany({ where: { workspaceId } }),
    prisma.apiKey.findMany({ where: { workspaceId } }),
    getSystemStatus(),
  ]);

  const deliveryRate = totalEmails > 0 ? ((deliveredCount / totalEmails) * 100).toFixed(1) : "0.0";
  const uniqueRecipients = await prisma.email.groupBy({ by: ["to"], where: { workspaceId } });
  const allOk = systemChecks.every(c => c.ok);
  const okCount = systemChecks.filter(c => c.ok).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  const statusColor: Record<string, string> = { DELIVERED: "#22c55e", FAILED: "#ef4444", BOUNCED: "#f59e0b", PENDING: "#3b82f6", QUEUED: "#a78bfa" };

  const C = {
    bg: "#0B0F1A", surface: "#111827", surface2: "#141B2D", surface3: "#1A2235",
    border: "rgba(255,255,255,0.06)", text: "#e2e8f0", muted: "#64748b",
    green: "#22c55e", red: "#ef4444", amber: "#f59e0b", blue: "#3b82f6", purple: "#a78bfa", indigo: "#6366f1",
  };

  const categoryGroups: Record<string, typeof systemChecks> = {};
  for (const c of systemChecks) {
    if (!categoryGroups[c.category]) categoryGroups[c.category] = [];
    categoryGroups[c.category].push(c);
  }
  const catLabels: Record<string, string> = { infra: "Infraestructura", email: "Servicios Email", auth: "Autenticación", integrations: "Integraciones", ecosystem: "Ecosistema ConectaAI" };

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* Hero header */}
      <div style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.08) 0%,rgba(139,92,246,0.04) 100%)", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "28px 32px 24px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 4px" }}>{greeting}, <strong style={{ color: C.text }}>{session?.user?.name || "Admin"}</strong></p>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: C.text, letterSpacing: "-0.5px" }}>Mail Dashboard</h1>
            <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>Plataforma de correo transaccional · ConectaAI Mail</p>
          </div>
          {/* System health pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 50, background: allOk ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${allOk ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: allOk ? C.green : C.red, boxShadow: `0 0 8px ${allOk ? C.green : C.red}`, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: allOk ? C.green : C.red }}>{allOk ? "Todos los sistemas OK" : `${okCount}/${systemChecks.length} sistemas activos`}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 32px" }}>

        {/* KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total enviados", value: totalEmails.toLocaleString(), sub: "histórico", color: C.indigo, icon: "✉" },
            { label: "Tasa entrega", value: deliveryRate + "%", sub: deliveredCount + " entregados", color: C.green, icon: "✓" },
            { label: "Fallidos", value: failedCount.toLocaleString(), sub: bouncedCount + " rebotados", color: C.red, icon: "✕" },
            { label: "Audiencia", value: uniqueRecipients.length.toLocaleString(), sub: "destinatarios únicos", color: C.purple, icon: "⊕" },
          ].map(k => (
            <div key={k.label} style={{ background: C.surface3, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 16, right: 16, fontSize: 22, opacity: 0.15, color: k.color }}>{k.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color, marginBottom: 2 }}>{k.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 28 }}>

          {/* Recent emails */}
          <div style={{ background: C.surface3, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Actividad reciente</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Últimos 8 correos procesados</div>
              </div>
              <Link href="/dashboard/outbox" style={{ fontSize: 12, color: C.indigo, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>Ver todos <ArrowRightIcon size={12} /></Link>
            </div>
            {recentEmails.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: C.muted }}>
                <MailIcon size={28} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: 13 }}>Sin actividad aún</p>
              </div>
            ) : (
              <div>
                {recentEmails.map((email: any) => (
                  <div key={email.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor[email.status] ?? C.muted, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.subject || "(sin asunto)"}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>→ {email.to}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: (statusColor[email.status] ?? C.muted) + "18", color: statusColor[email.status] ?? C.muted }}>{email.status}</span>
                      <span style={{ fontSize: 10, color: C.muted }}>{new Date(email.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Pending alert */}
            {pendingCount > 0 && (
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <ClockIcon size={14} color={C.amber} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>Correos pendientes</span>
                </div>
                <span style={{ fontSize: 24, fontWeight: 800, color: C.amber }}>{pendingCount}</span>
                <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>en cola de envío</p>
              </div>
            )}

            {/* Domain status */}
            <div style={{ background: C.surface3, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <GlobeIcon size={14} color={C.indigo} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Dominios</span>
              </div>
              {domains.length === 0 ? (
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Sin dominios configurados</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {domains.map((d: any) => (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: C.text }}>{d.domain}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: d.verified ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: d.verified ? C.green : C.red }}>{d.verified ? "Verificado" : "Pendiente"}</span>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/dashboard/domains" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, fontSize: 11, color: C.indigo, textDecoration: "none" }}>Gestionar dominios <ArrowRightIcon size={10} /></Link>
            </div>

            {/* API Keys */}
            <div style={{ background: C.surface3, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <KeyIcon size={14} color={C.purple} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>API Keys</span>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: C.purple }}>{apiKeys.filter((k: any) => !k.name.startsWith("webhook:")).length}</span>
              <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>keys activas</p>
            </div>
          </div>
        </div>

        {/* ── System Status Grid ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <ActivityIcon size={18} color={C.indigo} />
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: C.text }}>Estado de Sistemas</h2>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: allOk ? C.green : C.red, fontWeight: 600 }}>{okCount}/{systemChecks.length} operativos</span>
          </div>

          {Object.entries(categoryGroups).map(([cat, checks]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10, paddingLeft: 4 }}>
                {catLabels[cat] ?? cat}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
                {checks.map((c: any) => <SystemCard key={c.name} check={c} />)}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
