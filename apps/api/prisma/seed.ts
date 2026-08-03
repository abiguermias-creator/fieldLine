import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // Create Admin/Technician User
  const user = await prisma.user.upsert({
    where: {
      email: "admin@fieldline.com",
    },
    update: {},
    create: {
      email: "admin@fieldline.com",
      password: passwordHash,
      role: UserRole.TECHNICIAN,
    },
  });

  // Create Technician Profile
  const technicianProfile = await prisma.technicianProfile.upsert({
    where: {
      userId: user.id,
    },
    update: {},
    create: {
      userId: user.id,
      phone: "+251900000000",
      bio: "Field service technician",
    },
  });

  // Create Client
  const client = await prisma.client.upsert({
    where: {
      email: "contact@abc.com",
    },
    update: {},
    create: {
      name: "ABC Company",
      email: "contact@abc.com",
      phone: "+251911111111",
      address: "Addis Ababa",
      contactName: "Abebe Kebede",
    },
  });

  // Create Site
  const site = await prisma.site.upsert({
    where: {
      name_clientId: {
        name: "Main Office",
        clientId: client.id,
      },
    },
    update: {},
    create: {
      clientId: client.id,
      name: "Main Office",
      address: "Bole, Addis Ababa",
    },
  });

  // Create Skills
  await prisma.skill.createMany({
    data: [
      { name: "Electrical Repair" },
      { name: "Equipment Maintenance" },
    ],
    skipDuplicates: true,
  });

  // Create Equipment
  const equipment = await prisma.equipment.upsert({
    where: {
      serialNumber: "EQ-001",
    },
    update: {},
    create: {
      name: "Testing Machine",
      description: "Diagnostic equipment",
      serialNumber: "EQ-001",
    },
  });

  // Create Work Order
  await prisma.workOrder.create({
    data: {
      clientId: client.id,
      siteId: site.id,
      technicianId: technicianProfile.id,
      title: "Inspect equipment",
      description: "Routine maintenance inspection",
      priority: "HIGH",
      status: "OPEN",
    },
  });

  console.log("✅ Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });