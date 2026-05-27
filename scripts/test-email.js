const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "a585e1001@smtp-brevo.com",
      pass: "xsmtpsib-d40677c7dda0a7c20791700f0a66ed1dee72d7cd1e2d8edf0f9da7d26b56653b-Dy4HlqkrU6trXDrl",
    },
    logger: true,
    debug: true
  });

  try {
    const info = await transporter.sendMail({
      from: '"ConectaAI Prueba" <a585e1001@smtp-brevo.com>', // Usando el remitente de .env que sabemos que es válido
      to: "corp.conectaai@gmail.com",
      subject: "Test desde script de depuración",
      text: "Si recibes esto, el servidor SMTP de Brevo funciona perfectamente usando el remitente a585e1001@smtp-brevo.com.",
      html: "<b>Si recibes esto, el servidor SMTP de Brevo funciona perfectamente usando el remitente base.</b>",
    });

    console.log("Mensaje enviado con éxito: %s", info.messageId);
    console.log("Respuesta de Brevo: %s", info.response);
  } catch (err) {
    console.error("Error al enviar el correo:", err);
  }
}

testEmail();
