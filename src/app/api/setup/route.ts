import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const password = searchParams.get("password");
    const secret = searchParams.get("secret");

    // Seguridad básica temporal
    if (secret !== "setup123") {
      return NextResponse.json({ error: "Secret parameter invalid" }, { status: 403 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    // Si ya existe, actualizar la contraseña (modo reset)
    if (existing) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { email }, data: { password: hashedPassword } });
      return NextResponse.json({ success: true, action: "password_reset" }, { status: 200 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario Administrador y un Workspace por defecto
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Admin",
        workspaces: {
          create: {
             role: "OWNER",
             workspace: {
                create: {
                  name: "Default Workspace",
                  slug: "default"
                }
             }
          }
        }
      }
    });

    return NextResponse.json({ success: true, user: { email: user.email } }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
