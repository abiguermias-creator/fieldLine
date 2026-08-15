const { PrismaClient } = require("@prisma/client");

const p = new PrismaClient();

p.user.create({
  data: {
    email: "role-test-client@test.com",
    passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$1aigDzUHDozqIk3CNoNhZQ$LQUHq229qSyMOx8x9LWAEG+M3uniLfnCKmLk6MtMxyI",
    fullName: "Role Test Client",
    role: "CLIENT"
  }
})
.then(u => console.log({ id: u.id, email: u.email, role: u.role }))
.catch(console.error)
.finally(() => p.$disconnect());
