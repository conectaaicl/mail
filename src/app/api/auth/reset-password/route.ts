import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const token = formData.get("token")?.toString();
    const password = formData.get("password")?.toString();

    if (!token || !password) {
      return NextResponse.redirect(new URL("/reset-password?error=bad_request", req.url));
    }

    const vt = await prisma.verificationToken.findFirst({
      where: { token, expires: { gt: new Date() } }
    });

    if (!vt) {
      return NextResponse.redirect(new URL("/reset-password?error=invalid_token", req.url));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar contraseña del usuario
    await prisma.user.update({
      where: { email: vt.identifier },
      data: { password: hashedPassword }
    });

    // Quemar token para que no se re-use
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: vt.identifier, token: vt.token } }
    });

    // Redirigir al login con mensaje de éxito
    return NextResponse.redirect(new URL("/login?message=password_reset_success", req.url));

  } catch (error) {
    console.error("Reset password error", error);
    return NextResponse.redirect(new URL("/reset-password?error=server_error", req.url));
  }
}
