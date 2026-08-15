const { PrismaClient } = require("@prisma/client");

const p = new PrismaClient();

p.user
  .findMany({
    select: {
      email: true,
      role: true
    }
  })
  .then(console.log)
  .finally(() => p.$disconnect());
