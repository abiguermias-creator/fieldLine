import type { AssignmentContext, AssignmentCheck, RuleViolation } from "@fieldline/shared";

// Rule 1: No scheduling in the past
export function ruleNotInPast(ctx: AssignmentContext, now: Date): RuleViolation | null {
  if (ctx.proposed.startsAt.getTime() < now.getTime()) {
    return {
      code: "SCHEDULE_IN_PAST",
      message: "Proposed start time cannot be in the past.",
      overridable: false,
    };
  }

  return null;
}

// Rule 2: Active work orders only
export function ruleWorkOrderAssignable(ctx: AssignmentContext): RuleViolation | null {
  if (["CLOSED", "CANCELLED"].includes(ctx.workOrder.status)) {
    return {
      code: "WORK_ORDER_NOT_ASSIGNABLE",
      message: `Work order in ${ctx.workOrder.status} status cannot be assigned.`,
      overridable: false,
    };
  }

  return null;
}

// Rule 3: Technician availability
// Intervals use [start, end), so touching boundaries are allowed.
export function ruleTechnicianFree(ctx: AssignmentContext): RuleViolation | null {
  const proposedStart = ctx.proposed.startsAt.getTime();

  const proposedEnd = ctx.proposed.endsAt.getTime();

  for (const existing of ctx.technician.sameDayAssignments) {
    const existingStart = existing.startsAt.getTime();

    const existingEnd = existing.endsAt.getTime();

    if (proposedStart < existingEnd && proposedEnd > existingStart) {
      return {
        code: "TECHNICIAN_UNAVAILABLE",
        message: `${ctx.technician.fullName} is already assigned to ${existing.workOrderReference}.`,
        overridable: false,
      };
    }
  }

  return null;
}

// Rule 4: Equipment availability
export function ruleEquipmentFree(ctx: AssignmentContext): RuleViolation | null {
  for (const item of ctx.equipment) {
    if (item.conflicts.length > 0) {
      return {
        code: "EQUIPMENT_UNAVAILABLE",
        message: `Equipment ${item.code} is already assigned to ${item.conflicts[0]?.workOrderReference}.`,
        overridable: false,
      };
    }
  }

  return null;
}

// Rule 5: Skill requirement and certification expiry
export function ruleSkillHeld(ctx: AssignmentContext): RuleViolation | null {
  for (const requiredSkillId of ctx.workOrder.requiredSkillIds) {
    const heldSkill = ctx.technician.skills.find((skill) => skill.skillId === requiredSkillId);

    if (!heldSkill) {
      return {
        code: "SKILL_NOT_HELD",
        message: `${ctx.technician.fullName} does not hold the required skill.`,
        overridable: false,
      };
    }

    if (
      heldSkill.certifiedUntil &&
      heldSkill.certifiedUntil.getTime() < ctx.proposed.startsAt.getTime()
    ) {
      return {
        code: "SKILL_EXPIRED",
        message: `${ctx.technician.fullName}'s skill certification expired before the scheduled job date.`,
        overridable: false,
      };
    }
  }

  return null;
}
// Rule 6: Travel feasibility
export function ruleTravelTime(ctx: AssignmentContext): RuleViolation | null {
  if (ctx.travelEstimate.source === "unknown") {
    return null;
  }

  const proposedStart = ctx.proposed.startsAt.getTime();

  const priorJob = [...ctx.technician.sameDayAssignments]
    .filter((assignment) => assignment.endsAt.getTime() <= proposedStart)
    .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0];

  if (!priorJob) {
    return null;
  }

  const availableGapMinutes = (proposedStart - priorJob.endsAt.getTime()) / (60 * 1000);

  if (availableGapMinutes < ctx.travelEstimate.minutes) {
    return {
      code: "INSUFFICIENT_TRAVEL_TIME",
      message: `Only ${Math.floor(availableGapMinutes)} min available between jobs, but ${ctx.travelEstimate.minutes} min travel required.`,
      overridable: true,
    };
  }

  return null;
}

// Rule 7: Daily working hours limit
export function ruleDailyHours(ctx: AssignmentContext): RuleViolation | null {
  const existingMinutes = ctx.technician.sameDayAssignments.reduce(
    (total, job) => total + (job.endsAt.getTime() - job.startsAt.getTime()) / (60 * 1000),
    0,
  );

  const proposedMinutes =
    (ctx.proposed.endsAt.getTime() - ctx.proposed.startsAt.getTime()) / (60 * 1000);

  const totalMinutes = existingMinutes + proposedMinutes;

  if (totalMinutes > ctx.technician.maxDailyMinutes) {
    return {
      code: "DAILY_HOURS_EXCEEDED",
      message: `Assignment pushes daily total to ${totalMinutes} min (limit: ${ctx.technician.maxDailyMinutes} min).`,
      overridable: true,
      context: {
        totalMinutes,
        maxMinutes: ctx.technician.maxDailyMinutes,
      },
    };
  }

  return null;
}

// Master pure checker
export function checkAssignment(ctx: AssignmentContext, now: Date): AssignmentCheck {
  const rules = [
    () => ruleNotInPast(ctx, now),
    () => ruleWorkOrderAssignable(ctx),
    () => ruleTechnicianFree(ctx),
    () => ruleEquipmentFree(ctx),
    () => ruleSkillHeld(ctx),
    () => ruleTravelTime(ctx),
    () => ruleDailyHours(ctx),
  ];

  const violations: RuleViolation[] = [];

  for (const rule of rules) {
    const violation = rule();

    if (violation) {
      violations.push(violation);
    }
  }

  return {
    allowed: violations.length === 0,
    violations,
  };
}
