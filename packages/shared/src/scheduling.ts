export type ErrorCode =
  | "SCHEDULE_IN_PAST"
  | "WORK_ORDER_NOT_ASSIGNABLE"
  | "TECHNICIAN_UNAVAILABLE"
  | "EQUIPMENT_UNAVAILABLE"
  | "SKILL_NOT_HELD"
  | "SKILL_EXPIRED"
  | "INSUFFICIENT_TRAVEL_TIME"
  | "DAILY_HOURS_EXCEEDED";

export interface RuleViolation {
  code: ErrorCode;
  message: string;
  overridable: boolean;
  context?: Record<string, unknown>;
}

export interface AssignmentCheck {
  allowed: boolean;
  violations: RuleViolation[];
}

export interface AssignmentContext {
  workOrder: {
    id: string;
    reference: string;
    status: string;
    requiredSkillIds: string[];
    site: {
      id: string;
      latitude: number | null;
      longitude: number | null;
    };
  };

  technician: {
    id: string;
    fullName: string;
    maxDailyMinutes: number;
    skills: {
      skillId: string;
      certifiedUntil: Date | null;
    }[];
    sameDayAssignments: {
      workOrderReference: string;
      startsAt: Date;
      endsAt: Date;
      site: {
        latitude: number | null;
        longitude: number | null;
      };
    }[];
  };

  equipment: {
    id: string;
    code: string;
    conflicts: {
      workOrderReference: string;
    }[];
  }[];

  proposed: {
    startsAt: Date;
    endsAt: Date;
  };

  travelEstimate: {
    minutes: number;
    source: "routing" | "straight-line" | "unknown";
  };
}
