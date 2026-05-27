import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { MailIcon } from "lucide-react"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const session = await auth()
  if (session) redirect("/dashboard")
  const { error, message } = await searchParams

  async function login(formData: FormData) {
    "use server"
    try {
      await signIn("credentials", { email: formData.get("email"), password: formData.get("password"), redirectTo: "/dashboard" })
    } catch (err) {
      if (err instanceof AuthError) redirect("/login?error=credentials")
      throw err
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #0D1117 0%, #141B2D 50%, #0D1117 100%)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(124,58,237,0.06) 0%, transparent 60%)" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)]">
            <MailIcon size={22} className="text-white" />
          </div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight text-white">ConectaAI</span>
            <span className="block text-xs text-indigo-400 font-bold tracking-[0.2em] uppercase -mt-0.5">Mail Platform</span>
          </div>
        </div>

        <div className="rounded-2xl p-8 shadow-2xl" style={{ background: "#1A2235", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-2xl font-extrabold text-white mb-1">Iniciar sesión</h2>
          <p className="text-zinc-500 text-sm mb-8">Plataforma de correo transaccional</p>

          {error === "credentials" && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
              Correo o contraseña incorrectos.
            </div>
          )}
          {message === "check_your_email" && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm mb-6">
              Revisa tu correo, te enviamos el enlace de recuperación.
            </div>
          )}
          {message === "password_reset_success" && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm mb-6">
              Contraseña actualizada. Ya puedes iniciar sesión.
            </div>
          )}

          <form action={login} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Correo electrónico</label>
              <input name="email" type="email" required placeholder="admin@conectaai.cl"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Contraseña</label>
                <a href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">¿Olvidaste tu contraseña?</a>
              </div>
              <input name="password" type="password" required placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <button type="submit"
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] mt-2"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              Entrar →
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">ConectaAI Mail © 2026 — Plataforma de correo transaccional</p>
      </div>
    </div>
  )
}
