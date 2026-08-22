import argon2 from "argon2";
import { prisma } from "./src/db/client.js";

const passwordHash = await argon2.hash("Test123456!");

await prisma.user.update({
  where: { email: "TECHNICIAN_EMAIL_HERE" },
  data: { passwordHash },
});

console.log("Password reset successfully.");
await prisma.$disconnect();
