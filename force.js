const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function run() {
  try {
    const email = "corp.conectaai@gmail.com";
    const password = "Conecta2026+";
    const hashed = await bcrypt.hash(password, 10);
    
    await p.user.update({
      where: { email },
      data: { password: hashed }
    });
    
    console.log("PASSWORD OVEWRITTEN SUCCESSFULLY");
  } catch(e) {
    console.error("Error setting password", e);
  } finally {
    await p.$disconnect();
  }
}
run();
