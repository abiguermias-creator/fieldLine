import type { AssignmentContext } from "@fieldline/shared";

export function at(timeStr: string, baseDate = "2026-08-28"): Date {
  return new Date(`${baseDate}T${timeStr}:00.000Z`);
}

export function buildContext(overrides: Partial<AssignmentContext> = {}): AssignmentContext {
  return {
    workOrder: {
      id: "wo-1",
      reference: "WO-2026-0001",
      status: "SCHEDULED",
      requiredSkillIds: [],
      site: {
        id: "site-1",
        latitude: 9.02,
        longitude: 38.74,
      },
      ...overrides.workOrder,
    },

    technician: {
      id: "tech-1",
      fullName: "Ayana Bekele",
      maxDailyMinutes: 480,
      skills: [],
      sameDayAssignments: [],
      ...overrides.technician,
    },

    equipment: overrides.equipment ?? [],

    proposed: {
      startsAt: at("10:00"),
      endsAt: at("12:00"),
      ...overrides.proposed,
    },

    travelEstimate: {
      minutes: 15,
      source: "routing",
      ...overrides.travelEstimate,
    },
  };
}
