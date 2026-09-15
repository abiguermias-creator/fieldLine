import "dotenv/config";
import { PrismaClient, UserRole, WorkOrderPriority, WorkOrderStatus } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const PASSWORD = "password123";

const clients = [
  {
    name: "Abyssinia Retail Group",
    email: "contact@abyssiniaretail.com",
    phone: "+251911100101",
    address: "Bole, Addis Ababa",
    contactName: "Mekdes Alemu",
  },
  {
    name: "Blue Nile Manufacturing",
    email: "contact@bluenilemfg.com",
    phone: "+251911100102",
    address: "Akaki, Addis Ababa",
    contactName: "Samuel Bekele",
  },
  {
    name: "Highland Hospitality",
    email: "contact@highlandhospitality.com",
    phone: "+251911100103",
    address: "Kazanchis, Addis Ababa",
    contactName: "Liya Tesfaye",
  },
  {
    name: "Ethio Logistics Hub",
    email: "contact@ethiologistics.com",
    phone: "+251911100104",
    address: "Gerji, Addis Ababa",
    contactName: "Dawit Girma",
  },
  {
    name: "Addis Business Center",
    email: "contact@addisbusinesscenter.com",
    phone: "+251911100105",
    address: "Mexico Square, Addis Ababa",
    contactName: "Sara Worku",
  },
  {
    name: "Green Valley Foods",
    email: "contact@greenvalleyfoods.com",
    phone: "+251911100106",
    address: "Lideta, Addis Ababa",
    contactName: "Hana Getachew",
  },
  {
    name: "Capital Health Network",
    email: "contact@capitalhealth.com",
    phone: "+251911100107",
    address: "Yeka, Addis Ababa",
    contactName: "Nahom Solomon",
  },
  {
    name: "East Africa Data Services",
    email: "contact@eadataservices.com",
    phone: "+251911100108",
    address: "CMC, Addis Ababa",
    contactName: "Rahel Tadesse",
  },
];

const sites = [
  {
    clientIndex: 0,
    name: "Bole Headquarters",
    address: "Bole Road, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Reception desk on ground floor. Visitor badge required.",
    latitude: 8.995,
    longitude: 38.788,
  },
  {
    clientIndex: 0,
    name: "Kazanchis Retail Branch",
    address: "Kazanchis, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Loading entrance is on the east side of the building.",
    latitude: 9.015,
    longitude: 38.765,
  },
  {
    clientIndex: 0,
    name: "CMC Distribution Store",
    address: "CMC, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Call security before entering the warehouse.",
    latitude: 9.010,
    longitude: 38.850,
  },
  {
    clientIndex: 1,
    name: "Akaki Production Plant",
    address: "Akaki Industrial Area, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Safety shoes and visitor vest required.",
    latitude: 8.880,
    longitude: 38.780,
  },
  {
    clientIndex: 1,
    name: "Kality Warehouse",
    address: "Kality, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Warehouse manager must approve access.",
    latitude: 8.910,
    longitude: 38.800,
  },
  {
    clientIndex: 2,
    name: "Kazanchis Hotel",
    address: "Kazanchis, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Use service elevator behind reception.",
    latitude: 9.015,
    longitude: 38.765,
  },
  {
    clientIndex: 2,
    name: "Bole Conference Center",
    address: "Bole, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Engineering office is beside the main conference hall.",
    latitude: 8.997,
    longitude: 38.790,
  },
  {
    clientIndex: 3,
    name: "Gerji Logistics Depot",
    address: "Gerji, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Truck entrance is separate from visitor entrance.",
    latitude: 9.020,
    longitude: 38.825,
  },
  {
    clientIndex: 3,
    name: "Airport Cargo Office",
    address: "Bole Airport Cargo Area, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Security clearance required at cargo gate.",
    latitude: 8.977,
    longitude: 38.800,
  },
  {
    clientIndex: 4,
    name: "Mexico Square Office",
    address: "Mexico Square, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Reception can direct technicians to facilities office.",
    latitude: 9.005,
    longitude: 38.752,
  },
  {
    clientIndex: 4,
    name: "Piassa Branch",
    address: "Piassa, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Parking is limited; use the underground loading bay.",
    latitude: 9.035,
    longitude: 38.750,
  },
  {
    clientIndex: 5,
    name: "Lideta Processing Center",
    address: "Lideta, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Production floor access only with supervisor approval.",
    latitude: 9.005,
    longitude: 38.735,
  },
  {
    clientIndex: 5,
    name: "Merkato Cold Store",
    address: "Merkato, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Cold-room access requires protective clothing.",
    latitude: 9.030,
    longitude: 38.735,
  },
  {
    clientIndex: 6,
    name: "Yeka Medical Center",
    address: "Yeka, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Technicians must check in with facilities desk.",
    latitude: 9.035,
    longitude: 38.820,
  },
  {
    clientIndex: 6,
    name: "Bole Health Campus",
    address: "Bole, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Avoid patient areas; use engineering access corridor.",
    latitude: 8.995,
    longitude: 38.805,
  },
  {
    clientIndex: 7,
    name: "CMC Data Center",
    address: "CMC, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Two-factor security check at entrance.",
    latitude: 9.015,
    longitude: 38.850,
  },
  {
    clientIndex: 7,
    name: "Bole Network Office",
    address: "Bole, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Server room access must be confirmed with NOC.",
    latitude: 8.995,
    longitude: 38.795,
  },
  {
    clientIndex: 2,
    name: "Entoto Resort Facilities",
    address: "Entoto, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Steep access road; contact site manager before arrival.",
    latitude: 9.080,
    longitude: 38.760,
  },
  {
    clientIndex: 3,
    name: "Sarbet Dispatch Yard",
    address: "Sarbet, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Technician should report to dispatch office on arrival.",
    latitude: 9.000,
    longitude: 38.730,
  },
  {
    clientIndex: 5,
    name: "Old Airport Food Depot",
    address: "Old Airport, Addis Ababa",
    city: "Addis Ababa",
    accessNotes: "Use rear service gate.",
    latitude: 8.990,
    longitude: 38.790,
  },
];

const technicianData = [
  {
    email: "technician@fieldline.com",
    fullName: "Daniel Bekele",
    employeeCode: "TECH-001",
    phone: "+251911200001",
    baseLocation: "Bole",
    skills: ["Electrical Repair", "Equipment Maintenance"],
  },
  {
    email: "abel.mekonnen@fieldline.com",
    fullName: "Abel Mekonnen",
    employeeCode: "TECH-002",
    phone: "+251911200002",
    baseLocation: "Akaki",
    skills: ["Electrical Repair", "HVAC Service"],
  },
  {
    email: "meron.tadesse@fieldline.com",
    fullName: "Meron Tadesse",
    employeeCode: "TECH-003",
    phone: "+251911200003",
    baseLocation: "Kazanchis",
    skills: ["HVAC Service", "Equipment Maintenance"],
  },
  {
    email: "yohannes.girma@fieldline.com",
    fullName: "Yohannes Girma",
    employeeCode: "TECH-004",
    phone: "+251911200004",
    baseLocation: "CMC",
    skills: ["Network Systems", "Electrical Repair"],
  },
  {
    email: "selamawit.kebede@fieldline.com",
    fullName: "Selamawit Kebede",
    employeeCode: "TECH-005",
    phone: "+251911200005",
    baseLocation: "Yeka",
    skills: ["HVAC Service", "Electrical Repair"],
  },
  {
    email: "henok.abebe@fieldline.com",
    fullName: "Henok Abebe",
    employeeCode: "TECH-006",
    phone: "+251911200006",
    baseLocation: "Lideta",
    skills: ["Equipment Maintenance", "Mechanical Repair"],
  },
  {
    email: "tsehay.worku@fieldline.com",
    fullName: "Tsehay Worku",
    employeeCode: "TECH-007",
    phone: "+251911200007",
    baseLocation: "Bole",
    skills: ["Network Systems", "Equipment Maintenance"],
  },
  {
    email: "dawit.solomon@fieldline.com",
    fullName: "Dawit Solomon",
    employeeCode: "TECH-008",
    phone: "+251911200008",
    baseLocation: "Piassa",
    skills: ["Electrical Repair", "Mechanical Repair"],
  },
  {
    email: "hana.mulugeta@fieldline.com",
    fullName: "Hana Mulugeta",
    employeeCode: "TECH-009",
    phone: "+251911200009",
    baseLocation: "Sarbet",
    skills: ["HVAC Service", "Mechanical Repair"],
  },
  {
    email: "bereket.gebre@fieldline.com",
    fullName: "Bereket Gebre",
    employeeCode: "TECH-010",
    phone: "+251911200010",
    baseLocation: "Gerji",
    skills: ["Network Systems", "Electrical Repair"],
  },
  {
    email: "rahel.yilma@fieldline.com",
    fullName: "Rahel Yilma",
    employeeCode: "TECH-011",
    phone: "+251911200011",
    baseLocation: "Kality",
    skills: ["Equipment Maintenance", "HVAC Service"],
  },
  {
    email: "michael.tesfaye@fieldline.com",
    fullName: "Michael Tesfaye",
    employeeCode: "TECH-012",
    phone: "+251911200012",
    baseLocation: "Merkato",
    skills: ["Mechanical Repair", "Network Systems"],
  },
];

const skillData = [
  { code: "ELEC-001", name: "Electrical Repair" },
  { code: "MAINT-001", name: "Equipment Maintenance" },
  { code: "HVAC-001", name: "HVAC Service" },
  { code: "NET-001", name: "Network Systems" },
  { code: "MECH-001", name: "Mechanical Repair" },
];

const workOrderTitles = [
  "Inspect electrical panel",
  "HVAC cooling issue",
  "Preventive equipment maintenance",
  "Network cabinet inspection",
  "Repair failed circuit",
  "Replace air conditioning filter",
  "Generator maintenance",
  "Check refrigeration system",
  "Inspect power distribution",
  "Repair equipment vibration",
  "Network connectivity investigation",
  "Emergency cooling repair",
  "Replace damaged breaker",
  "Routine mechanical inspection",
  "Calibrate monitoring equipment",
  "Inspect backup power system",
  "Repair ventilation unit",
  "Server room temperature check",
  "Warehouse equipment inspection",
  "Electrical safety inspection",
  "Replace worn mechanical component",
  "HVAC preventive maintenance",
  "Data center cooling inspection",
  "Repair warehouse lighting",
  "Inspect control panel",
  "Maintenance follow-up",
  "Test emergency power supply",
  "Inspect compressor",
  "Network rack maintenance",
  "Repair industrial equipment",
  "Check motor temperature",
  "Replace faulty sensor",
  "Inspect refrigeration controls",
  "Electrical fault investigation",
  "Preventive site inspection",
  "Repair ventilation fan",
  "Inspect generator controls",
  "Test network equipment",
  "Replace damaged cable",
  "Equipment safety inspection",
  "HVAC airflow investigation",
  "Inspect electrical grounding",
  "Repair mechanical drive",
  "Routine facilities inspection",
];

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function calculateSlaTargets(
  createdAt: Date,
  priority: WorkOrderPriority,
  agreedDate?: Date | null,
) {
  switch (priority) {
    case WorkOrderPriority.P1:
      return {
        slaRespondBy: addHours(createdAt, 1),
        slaResolveBy: addHours(createdAt, 4),
      };
    case WorkOrderPriority.P2:
      return {
        slaRespondBy: addHours(createdAt, 4),
        slaResolveBy: addHours(createdAt, 24),
      };
    case WorkOrderPriority.P3:
      return {
        slaRespondBy: addHours(createdAt, 24),
        slaResolveBy: addDays(createdAt, 5),
      };
    case WorkOrderPriority.P4:
      return {
        slaRespondBy: null,
        slaResolveBy: agreedDate ?? addDays(createdAt, 7),
      };
  }
}

async function upsertUser(
  email: string,
  fullName: string,
  role: UserRole,
  clientId?: string,
) {
  const passwordHash = await argon2.hash(PASSWORD);

  return prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      fullName,
      role,
      clientId: clientId ?? null,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      fullName,
      role,
      clientId: clientId ?? null,
      isActive: true,
    },
  });
}

async function main() {
  console.log("Starting Fieldline demo seed...");


  const skills = new Map<string, { id: string }>();

  for (const skill of skillData) {
    const record = await prisma.skill.upsert({
      where: { code: skill.code },
      update: { name: skill.name },
      create: skill,
    });

    skills.set(skill.name, record);
  }


  const clientRecords: { id: string; name: string }[] = [];

  for (const clientData of clients) {
    const existing = await prisma.client.findFirst({
      where: { name: clientData.name },
    });

    const client = existing
      ? await prisma.client.update({
          where: { id: existing.id },
          data: {
            email: clientData.email,
            phone: clientData.phone,
            address: clientData.address,
            contactName: clientData.contactName,
            isActive: true,
          },
        })
      : await prisma.client.create({
          data: {
            ...clientData,
            isActive: true,
          },
        });

    clientRecords.push({
      id: client.id,
      name: client.name,
    });
  }


  const dispatcher = await upsertUser(
    "admin@fieldline.com",
    "Fieldline Dispatcher",
    UserRole.DISPATCHER,
  );

  await upsertUser(
    "supervisor@fieldline.com",
    "Fieldline Supervisor",
    UserRole.SUPERVISOR,
  );

  await upsertUser(
    "client@abc.com",
    "ABC Company Contact",
    UserRole.CLIENT,
    clientRecords[0].id,
  );

  const oldDispatcherProfile = await prisma.technicianProfile.findUnique({
    where: { userId: dispatcher.id },
  });

  if (oldDispatcherProfile) {
    await prisma.workOrder.updateMany({
      where: { technicianId: oldDispatcherProfile.id },
      data: { technicianId: null },
    });

    await prisma.workLog.deleteMany({
      where: { technicianId: oldDispatcherProfile.id },
    });

    await prisma.technicianProfile.delete({
      where: { id: oldDispatcherProfile.id },
    });
  }


  const siteRecords: { id: string; clientId: string; name: string }[] = [];

  for (const siteData of sites) {
    const client = clientRecords[siteData.clientIndex];

    const existing = await prisma.site.findFirst({
      where: {
        clientId: client.id,
        name: siteData.name,
      },
    });

    const site = existing
      ? await prisma.site.update({
          where: { id: existing.id },
          data: {
            address: siteData.address,
            city: siteData.city,
            accessNotes: siteData.accessNotes,
            latitude: siteData.latitude,
            longitude: siteData.longitude,
            coordinatesManual: true,
            needsManualPlacement: false,
            isActive: true,
          },
        })
      : await prisma.site.create({
          data: {
            clientId: client.id,
            name: siteData.name,
            address: siteData.address,
            city: siteData.city,
            accessNotes: siteData.accessNotes,
            latitude: siteData.latitude,
            longitude: siteData.longitude,
            coordinatesManual: true,
            needsManualPlacement: false,
            isActive: true,
          },
        });

    siteRecords.push({
      id: site.id,
      clientId: client.id,
      name: site.name,
    });
  }


  const technicianProfiles: { id: string; email: string }[] = [];

  for (let index = 0; index < technicianData.length; index += 1) {
    const data = technicianData[index];

    const user = await upsertUser(
      data.email,
      data.fullName,
      UserRole.TECHNICIAN,
    );

    const profile = await prisma.technicianProfile.upsert({
      where: { userId: user.id },
      update: {
        employeeCode: data.employeeCode,
        baseLocation: data.baseLocation,
        phone: data.phone,
        bio: `${data.fullName} is a Fieldline field technician.`,
        locationSharingEnabled: true,
      },
      create: {
        userId: user.id,
        employeeCode: data.employeeCode,
        baseLocation: data.baseLocation,
        phone: data.phone,
        bio: `${data.fullName} is a Fieldline field technician.`,
        locationSharingEnabled: true,
      },
    });

    technicianProfiles.push({
      id: profile.id,
      email: data.email,
    });

    for (const skillName of data.skills) {
      const skill = skills.get(skillName);

      if (!skill) {
        continue;
      }

      const certificationExpiresAt =
        index % 4 === 0
          ? addDays(new Date(), 180)
          : index % 4 === 1
            ? addDays(new Date(), 365)
            : addDays(new Date(), 90);

      await prisma.technicianSkill.upsert({
        where: {
          technicianId_skillId: {
            technicianId: profile.id,
            skillId: skill.id,
          },
        },
        update: {
          certificationExpiresAt,
        },
        create: {
          technicianId: profile.id,
          skillId: skill.id,
          certificationExpiresAt,
        },
      });
    }
  }


  const equipmentData = [
    {
      code: "EQ-001",
      name: "Electrical Diagnostic Kit",
      category: "Diagnostic",
      description: "Portable electrical testing equipment",
      serialNumber: "FL-EQ-001",
    },
    {
      code: "EQ-002",
      name: "HVAC Service Kit",
      category: "HVAC",
      description: "HVAC pressure and temperature testing equipment",
      serialNumber: "FL-EQ-002",
    },
    {
      code: "EQ-003",
      name: "Network Analyzer",
      category: "Network",
      description: "Network diagnostic and cable testing equipment",
      serialNumber: "FL-EQ-003",
    },
    {
      code: "EQ-004",
      name: "Mechanical Inspection Kit",
      category: "Mechanical",
      description: "Mechanical inspection and measurement tools",
      serialNumber: "FL-EQ-004",
    },
  ];

  const equipmentRecords: { id: string; code: string }[] = [];

  for (const equipment of equipmentData) {
    const record = await prisma.equipment.upsert({
      where: { code: equipment.code },
      update: {
        name: equipment.name,
        category: equipment.category,
        description: equipment.description,
        serialNumber: equipment.serialNumber,
        isActive: true,
      },
      create: {
        ...equipment,
        isActive: true,
      },
    });

    equipmentRecords.push({
      id: record.id,
      code: record.code,
    });
  }

  const statuses: WorkOrderStatus[] = [
    WorkOrderStatus.NEW,
    WorkOrderStatus.NEW,
    WorkOrderStatus.NEW,
    WorkOrderStatus.NEW,
    WorkOrderStatus.NEW,
    WorkOrderStatus.NEW,
    WorkOrderStatus.NEW,
    WorkOrderStatus.NEW,

    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.ASSIGNED,

    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.IN_PROGRESS,

    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.COMPLETED,
  ];

  const priorities: WorkOrderPriority[] = [
    WorkOrderPriority.P1,
    WorkOrderPriority.P2,
    WorkOrderPriority.P2,
    WorkOrderPriority.P3,
    WorkOrderPriority.P3,
    WorkOrderPriority.P3,
    WorkOrderPriority.P4,
    WorkOrderPriority.P2,
    WorkOrderPriority.P1,
    WorkOrderPriority.P2,
    WorkOrderPriority.P3,
    WorkOrderPriority.P3,
    WorkOrderPriority.P2,
    WorkOrderPriority.P3,
    WorkOrderPriority.P4,
    WorkOrderPriority.P3,
    WorkOrderPriority.P1,
    WorkOrderPriority.P2,
    WorkOrderPriority.P2,
    WorkOrderPriority.P3,
    WorkOrderPriority.P3,
    WorkOrderPriority.P2,
    WorkOrderPriority.P3,
    WorkOrderPriority.P4,
    WorkOrderPriority.P3,
    WorkOrderPriority.P3,
    WorkOrderPriority.P2,
    WorkOrderPriority.P3,
    WorkOrderPriority.P3,
    WorkOrderPriority.P4,
    WorkOrderPriority.P3,
    WorkOrderPriority.P2,
    WorkOrderPriority.P3,
    WorkOrderPriority.P3,
    WorkOrderPriority.P2,
    WorkOrderPriority.P3,
    WorkOrderPriority.P4,
    WorkOrderPriority.P3,
    WorkOrderPriority.P2,
    WorkOrderPriority.P3,
    WorkOrderPriority.P3,
    WorkOrderPriority.P4,
    WorkOrderPriority.P3,
    WorkOrderPriority.P2,
  ];

  const now = new Date();

  for (let index = 0; index < statuses.length; index += 1) {
    const number = index + 1;
    const reference = `WO-2026-${String(number).padStart(4, "0")}`;

    const status = statuses[index];
    const priority = priorities[index];

    let createdAt: Date;

    if (status === WorkOrderStatus.COMPLETED) {
      createdAt = addDays(now, -(index - 20) * 0.7 - 2);
    } else if (number === 2) {
      // Deliberately at-risk: response target is only 10 minutes away.
      createdAt = new Date(now.getTime() - 3.83 * 60 * 60 * 1000);
    } else if (number === 1) {
      // P1 response target is 20 minutes away.
      createdAt = new Date(now.getTime() - 40 * 60 * 1000);
    } else {
      createdAt = addHours(now, -(index % 6) - 1);
    }

    const agreedDate =
      priority === WorkOrderPriority.P4 ? addDays(now, 4 + (index % 3)) : null;

    const sla = calculateSlaTargets(createdAt, priority, agreedDate);

    const clientIndex = index % clientRecords.length;
    const siteIndex = index % siteRecords.length;

    const clientId = clientRecords[clientIndex].id;
    const site = siteRecords[siteIndex];

    const technician =
  status === WorkOrderStatus.NEW
    ? null
    : technicianProfiles[index % technicianProfiles.length];

const equipment =
  status === WorkOrderStatus.ASSIGNED ||
  status === WorkOrderStatus.IN_PROGRESS
    ? equipmentRecords[index % equipmentRecords.length]
    : null;

const scheduledAt =
  status === WorkOrderStatus.ASSIGNED ||
  status === WorkOrderStatus.IN_PROGRESS
    ? new Date(now.getTime() + (index - 8) * 3 * 60 * 60 * 1000)
    : null;

const scheduledEndAt = scheduledAt
  ? new Date(scheduledAt.getTime() + (60 + (index % 3) * 30) * 60 * 1000)
  : null;

const completedAt =
  status === WorkOrderStatus.COMPLETED
    ? addHours(createdAt, 2 + (index % 5))
    : null;

    const estimatedDuration = 60 + (index % 4) * 30;

    const workOrder = await prisma.workOrder.upsert({
      where: { reference },
      update: {
  clientId,
  siteId: site.id,
  title: workOrderTitles[index],
  description: `Field service request for ${site.name}. Technician should review site access notes before arrival.`,
  isOutdoor: index % 5 === 0,
  status,
  priority,
  createdAt,
  scheduledAt,
  scheduledEndAt,
  estimatedDuration,
  agreedDate,
  slaRespondBy: sla.slaRespondBy,
  slaResolveBy: sla.slaResolveBy,
  technicianId: technician?.id ?? null,
  equipmentId: equipment?.id ?? null,
},
     create: {
  reference,
  clientId,
  siteId: site.id,
  title: workOrderTitles[index],
  description: `Field service request for ${site.name}. Technician should review site access notes before arrival.`,
  isOutdoor: index % 5 === 0,
  status,
  priority,
  createdAt,
  scheduledAt,
  scheduledEndAt,
  estimatedDuration,
  agreedDate,
  slaRespondBy: sla.slaRespondBy,
  slaResolveBy: sla.slaResolveBy,
  technicianId: technician?.id ?? null,
  equipmentId: equipment?.id ?? null,
},
    });

    const skillNames = technicianData[index % technicianData.length].skills;
    const requiredSkill = skills.get(skillNames[0]);

    if (requiredSkill) {
      await prisma.workOrderSkill.upsert({
        where: {
          workOrderId_skillId: {
            workOrderId: workOrder.id,
            skillId: requiredSkill.id,
          },
        },
        update: {},
        create: {
          workOrderId: workOrder.id,
          skillId: requiredSkill.id,
        },
      });
    }

    if (index % 3 === 0 && skillNames[1]) {
      const secondSkill = skills.get(skillNames[1]);

      if (secondSkill) {
        await prisma.workOrderSkill.upsert({
          where: {
            workOrderId_skillId: {
              workOrderId: workOrder.id,
              skillId: secondSkill.id,
            },
          },
          update: {},
          create: {
            workOrderId: workOrder.id,
            skillId: secondSkill.id,
          },
        });
      }
    }

    const eventActor = technician
      ? await prisma.user.findUnique({
          where: { email: technician.email },
        })
      : dispatcher;

    await prisma.workOrderEvent.deleteMany({
      where: {
        workOrderId: workOrder.id,
      },
    });

    await prisma.workOrderEvent.create({
      data: {
        workOrderId: workOrder.id,
        actorId: dispatcher.id,
        eventType: "CREATED",
        newValue: status,
        createdAt,
      },
    });

    if (technician && eventActor) {
      await prisma.workOrderEvent.create({
        data: {
          workOrderId: workOrder.id,
          actorId: dispatcher.id,
          eventType: "ASSIGNED",
          oldValue: WorkOrderStatus.NEW,
          newValue: status,
          createdAt: addHours(createdAt, 0.5),
        },
      });
    }

    if (status === WorkOrderStatus.IN_PROGRESS && technician && eventActor) {
      await prisma.workOrderEvent.create({
        data: {
          workOrderId: workOrder.id,
          actorId: eventActor.id,
          eventType: "STARTED",
          oldValue: WorkOrderStatus.ASSIGNED,
          newValue: WorkOrderStatus.IN_PROGRESS,
          createdAt: new Date(now.getTime() - 30 * 60 * 1000),
        },
      });
    }

    if (status === WorkOrderStatus.COMPLETED && technician && eventActor) {
      await prisma.workOrderEvent.create({
        data: {
          workOrderId: workOrder.id,
          actorId: eventActor.id,
          eventType: "COMPLETED",
          oldValue: WorkOrderStatus.IN_PROGRESS,
          newValue: WorkOrderStatus.COMPLETED,
          createdAt: completedAt ?? addHours(createdAt, 3),
        },
      });

      await prisma.workLog.deleteMany({
        where: { workOrderId: workOrder.id },
      });

      await prisma.workLog.create({
        data: {
          workOrderId: workOrder.id,
          technicianId: technician.id,
          note: "Completed scheduled field service work and recorded inspection results.",
          minutesSpent: estimatedDuration,
          partsUsed: index % 2 === 0 ? "Replacement fuse and cable ties" : null,
          createdAt: completedAt ?? addHours(createdAt, 3),
        },
      });
    }
  }

  await prisma.workOrderSequence.upsert({
    where: { year: 2026 },
    update: { lastNumber: 44 },
    create: { year: 2026, lastNumber: 44 },
  });

  console.log("");
  console.log("========================================");
  console.log("Fieldline demo seed completed");
  console.log("========================================");
  console.log("Demo accounts:");
  console.log("Dispatcher:  admin@fieldline.com");
  console.log("Technician:  technician@fieldline.com");
  console.log("Supervisor:  supervisor@fieldline.com");
  console.log("Client:      client@abc.com");
  console.log("Password:    password123");
  console.log("");
  console.log("Created/updated:");
  console.log("- 8 clients");
  console.log("- 20 sites");
  console.log("- 12 technicians");
  console.log("- 5 skills");
  console.log("- 4 equipment records");
  console.log("- 44 work orders");
  console.log("- SLA countdown and at-risk demo data");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });