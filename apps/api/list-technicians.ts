import { prisma } from "./src/db/client.js";

const technicians = await prisma.user.findMany({
  where: { role: "TECHNICIAN" },
  select: {
    email: true,
    fullName: true,
    isActive: true,
  },
});

console.table(technicians);

await prisma.$disconnect();
