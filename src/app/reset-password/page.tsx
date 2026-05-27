import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import { MailIcon } from "lucide-react"

const prisma = new PrismaClient()

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const session = await auth()
  if (session) redirect("/dashboard")
  const { token, error } = await searchParams

  const logo = (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
        <MailIcon size={20} className="text-white" />
      </div>
      <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">MailSaaS</span>
    </div>
  )

  if (!token) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C10] px-4">
      <div className="w-full max-w-md">{logo}
        <div className="bg-[#0F1115] border border-zinc-800/60 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">Enlace inválido</h2>
          <p className="text-zinc-400 text-sm mb-6">No se proporcionó un token de seguridad.</p>
          <a href="/login" className="text-indigo-400 hover:text-indigo-300 text-sm">← Volver al login</a>
        </div>
      </div>
    </div>
  )

  const vt = await prisma.verificationToken.findFirst({ where: { token, expires: { gt: new Date() } } })
  if (!vt) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C10] px-4">
      <div className="w-full max-w-md">{logo}
        <div className="bg-[#0F1115] border border-zinc-800/60 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">Enlace expirado</h2>
          <p className="text-zinc-400 text-sm mb-6">El token ha expirado o ya fue utilizado.</p>
          <a href="/forgot-password" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg font-bold transition-colors">Solicitar nuevo enlace</a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C10] px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/10 pointer-events-none" />
      <div className="w-full max-w-md relative z-10">{logo}
        <div className="bg-[#0F1115] border border-zinc-800/60 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-white mb-1">Nueva contraseña</h2>
          <p className="text-zinc-500 text-sm mb-8">Para la cuenta <span className="text-zinc-300">{vt.identifier}</span></p>
          {error === "server_error" && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">Hubo un error. Intenta de nuevo.</div>
          )}
          <form action="/api/auth/reset-password" method="POST" className="space-y-5">
            <input type="hidden" name="token" value={token} />
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nueva contraseña</label>
              <input name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#0A0C10] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors">Restablecer contraseña</button>
          </form>
        </div>
      </div>
    </div>
  )
}
