const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: { url: "file:./dev.db" }
  }
});

async function run() {
  try {
    const email = "corp.conectaai@gmail.com";
    const password = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log("User password updated");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: { 
        user: "a585e1001@smtp-brevo.com", 
        pass: "xsmtpsib-d40677c7dda0a7c20791700f0a66ed1dee72d7cd1e2d8edf0f9da7d26b56653b-Dy4HlqkrU6trXDrl" 
      },
    });

    await transporter.sendMail({
      from: '"ConectaAI Admin" <a585e1001@smtp-brevo.com>', // El remitente forzado, porque conectaai.cl no estaba verificado en Brevo
      to: email,
      subject: "Nuevas Credenciales de Superadmin (Corrección)",
      html: `<h2>Tu SaaS de Correos está listo (Reenvío)</h2>
             <p>El correo anterior no te llegó porque usamos 'noreply@conectaai.cl' y parece que ese dominio aún no está verificado/validado en Brevo como remitente válido, por lo que Brevo lo descartó silenciosamente.</p>
             <p><strong>URL de Login:</strong> https://mail.conectaai.cl/login (o en tu localhost:3000 si estás probando)</p>
             <p><strong>Usuario:</strong> ${email}</p>
             <p><strong>Nueva Contraseña:</strong> ${password}</p>
             <br/>
             <p>Ingresa, cambia tu contraseña si lo deseas, y comienza a usar el SaaS.</p>`
    });

    console.log("Email resent successfully to " + email);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
