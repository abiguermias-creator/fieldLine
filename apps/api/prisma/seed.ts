import { PrismaClient, UserRole } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash("password123");

  // Dispatcher User
   const user = await prisma.user.upsert({
    where: {
      email: "admin@fieldline.com",
    },
    update: {
      passwordHash,
      fullName: "Fieldline Dispatcher",
      role: UserRole.DISPATCHER,
      isActive: true,
    },
    create: {
      email: "admin@fieldline.com",
      passwordHash,
      fullName: "Fieldline Dispatcher",
      role: UserRole.DISPATCHER,
      isActive: true,
    },
  });

 
  // Technician Profile
    const technicianProfile = await prisma.technicianProfile.upsert({
    where: {
      userId: user.id,
    },
    update: {
      employeeCode: "DISP-001",
      baseLocation: "Addis Ababa",
      phone: "+251900000000",
      bio: "Field service technician",
    },
    create: {
      userId: user.id,
      employeeCode: "DISP-001",
      baseLocation: "Addis Ababa",
      phone: "+251900000000",
      bio: "Field service technician",
    },
  });

  
  // Client

  let client = await prisma.client.findFirst({
    where: {
      name: "ABC Company",
    },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        name: "ABC Company",
        email: "contact@abc.com",
        phone: "+251911111111",
        address: "Addis Ababa",
        contactName: "Abebe Kebede",
        isActive: true,
      },
    });
  }

  // Client User
await prisma.user.upsert({
  where: {
    email: "client@abc.com",
  },
  update: {
    passwordHash,
    fullName: "ABC Company Contact",
    role: UserRole.CLIENT,
    clientId: client.id,
    isActive: true,
  },
  create: {
    email: "client@abc.com",
    passwordHash,
    fullName: "ABC Company Contact",
    role: UserRole.CLIENT,
    clientId: client.id,
    isActive: true,
  },
});

  
  // Site
    let site = await prisma.site.findFirst({
    where: {
      clientId: client.id,
      name: "Main Office",
    },
  });

  if (!site) {
    site = await prisma.site.create({
      data: {
        clientId: client.id,
        name: "Main Office",
        address: "Bole, Addis Ababa",
        city: "Addis Ababa",
        isActive: true,
        coordinatesManual: false,
        needsManualPlacement: false,
      },
    });
  }

   // Skills
   const electricalSkill = await prisma.skill.upsert({
    where: {
      name: "Electrical Repair",
    },
    update: {
      code: "ELEC-001",
    },
    create: {
      code: "ELEC-001",
      name: "Electrical Repair",
    },
  });

  const maintenanceSkill = await prisma.skill.upsert({
    where: {
      name: "Equipment Maintenance",
    },
    update: {
      code: "MAINT-001",
    },
    create: {
      code: "MAINT-001",
      name: "Equipment Maintenance",
    },
  });

  
  // Equipment
   const equipment = await prisma.equipment.upsert({
    where: {
      code: "EQ-001",
    },
    update: {
      name: "Testing Machine",
      category: "Diagnostic",
      description: "Diagnostic equipment",
      serialNumber: "SERIAL-001",
      isActive: true,
    },
    create: {
      code: "EQ-001",
      name: "Testing Machine",
      category: "Diagnostic",
      description: "Diagnostic equipment",
      serialNumber: "SERIAL-001",
      isActive: true,
    },
  });

  
  // Technician Skills
   await prisma.technicianSkill.upsert({
    where: {
      technicianId_skillId: {
        technicianId: technicianProfile.id,
        skillId: electricalSkill.id,
      },
    },
    update: {},
    create: {
      technicianId: technicianProfile.id,
      skillId: electricalSkill.id,
    },
  });

  await prisma.technicianSkill.upsert({
    where: {
      technicianId_skillId: {
        technicianId: technicianProfile.id,
        skillId: maintenanceSkill.id,
      },
    },
    update: {},
    create: {
      technicianId: technicianProfile.id,
      skillId: maintenanceSkill.id,
    },
  });

  
  // Work Order
 const existingWorkOrder = await prisma.workOrder.findUnique({
    where: {
      reference: "WO-2026-0001",
    },
  });

  if (!existingWorkOrder) {
    await prisma.workOrder.create({
      data: {
        reference: "WO-2026-0001",
        clientId: client.id,
        siteId: site.id,
        technicianId: technicianProfile.id,
        equipmentId: equipment.id,
        title: "Inspect equipment",
        description: "Routine maintenance inspection",
        priority: "P1",
        status: "NEW",
      },
    });
  }


  // Work Order Sequence
   await prisma.workOrderSequence.upsert({
    where: {
      year: 2026,
    },
    update: {
      lastNumber: 5,
    },
    create: {
      year: 2026,
      lastNumber: 5,
    },
  });

  console.log("Seed completed successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });