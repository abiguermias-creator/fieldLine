import { describe, expect, it } from "vitest";

import {
  checkAssignment,
  ruleDailyHours,
  ruleEquipmentFree,
  ruleNotInPast,
  ruleSkillHeld,
  ruleTechnicianFree,
  ruleTravelTime,
  ruleWorkOrderAssignable,
} from "../../src/services/scheduling.js";

import { at, buildContext } from "../helpers/fixtures.js";

describe("scheduling pure core", () => {
  describe("ruleNotInPast", () => {
    it("allows a future assignment", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("10:00"),
          endsAt: at("12:00"),
        },
      });

      const violation = ruleNotInPast(ctx, at("09:00"));

      expect(violation).toBeNull();
    });

    it("rejects an assignment that starts in the past", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("08:59"),
          endsAt: at("10:00"),
        },
      });

      const violation = ruleNotInPast(ctx, at("09:00"));

      expect(violation?.code).toBe("SCHEDULE_IN_PAST");
    });

    it("allows an assignment starting exactly now", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("09:00"),
          endsAt: at("10:00"),
        },
      });

      const violation = ruleNotInPast(ctx, at("09:00"));

      expect(violation).toBeNull();
    });
  });

  describe("ruleWorkOrderAssignable", () => {
    it("allows a scheduled work order", () => {
      const ctx = buildContext({
        workOrder: {
          status: "SCHEDULED",
        },
      });

      expect(ruleWorkOrderAssignable(ctx)).toBeNull();
    });

    it("rejects a closed work order", () => {
      const ctx = buildContext({
        workOrder: {
          status: "CLOSED",
        },
      });

      const violation = ruleWorkOrderAssignable(ctx);

      expect(violation?.code).toBe("WORK_ORDER_NOT_ASSIGNABLE");
    });

    it("rejects a cancelled work order", () => {
      const ctx = buildContext({
        workOrder: {
          status: "CANCELLED",
        },
      });

      const violation = ruleWorkOrderAssignable(ctx);

      expect(violation?.code).toBe("WORK_ORDER_NOT_ASSIGNABLE");
    });

    it.each(["NEW", "TRIAGED", "SCHEDULED", "ASSIGNED", "IN_PROGRESS", "COMPLETED"])(
      "allows active status %s",
      (status) => {
        const ctx = buildContext({
          workOrder: { status },
        });

        expect(ruleWorkOrderAssignable(ctx)).toBeNull();
      },
    );
  });

  describe("ruleTechnicianFree", () => {
    it("allows a technician with no assignments", () => {
      const ctx = buildContext();

      expect(ruleTechnicianFree(ctx)).toBeNull();
    });

    it("rejects overlapping assignments", () => {
      const ctx = buildContext({
        technician: {
          sameDayAssignments: [
            {
              workOrderReference: "WO-2026-0002",
              startsAt: at("09:00"),
              endsAt: at("11:00"),
              site: {
                latitude: 9.03,
                longitude: 38.75,
              },
            },
          ],
        },
      });

      const violation = ruleTechnicianFree(ctx);

      expect(violation?.code).toBe("TECHNICIAN_UNAVAILABLE");
    });

    it("allows touching time boundaries", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("11:00"),
          endsAt: at("13:00"),
        },
        technician: {
          sameDayAssignments: [
            {
              workOrderReference: "WO-2026-0002",
              startsAt: at("09:00"),
              endsAt: at("11:00"),
              site: {
                latitude: 9.03,
                longitude: 38.75,
              },
            },
          ],
        },
      });

      expect(ruleTechnicianFree(ctx)).toBeNull();
    });

    it("rejects an assignment starting one minute before another ends", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("10:59"),
          endsAt: at("12:00"),
        },
        technician: {
          sameDayAssignments: [
            {
              workOrderReference: "WO-2026-0002",
              startsAt: at("09:00"),
              endsAt: at("11:00"),
              site: {
                latitude: 9.03,
                longitude: 38.75,
              },
            },
          ],
        },
      });

      expect(ruleTechnicianFree(ctx)?.code).toBe("TECHNICIAN_UNAVAILABLE");
    });

    it("allows an assignment ending exactly when another starts", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("07:00"),
          endsAt: at("09:00"),
        },
        technician: {
          sameDayAssignments: [
            {
              workOrderReference: "WO-2026-0002",
              startsAt: at("09:00"),
              endsAt: at("11:00"),
              site: {
                latitude: 9.03,
                longitude: 38.75,
              },
            },
          ],
        },
      });

      expect(ruleTechnicianFree(ctx)).toBeNull();
    });
  });

  describe("ruleEquipmentFree", () => {
    it("allows equipment with no conflicts", () => {
      const ctx = buildContext({
        equipment: [
          {
            id: "equipment-1",
            code: "EQ-001",
            conflicts: [],
          },
        ],
      });

      expect(ruleEquipmentFree(ctx)).toBeNull();
    });

    it("rejects equipment with a conflict", () => {
      const ctx = buildContext({
        equipment: [
          {
            id: "equipment-1",
            code: "EQ-001",
            conflicts: [
              {
                workOrderReference: "WO-2026-0002",
              },
            ],
          },
        ],
      });

      const violation = ruleEquipmentFree(ctx);

      expect(violation?.code).toBe("EQUIPMENT_UNAVAILABLE");
    });

    it("allows multiple available equipment items", () => {
      const ctx = buildContext({
        equipment: [
          {
            id: "equipment-1",
            code: "EQ-001",
            conflicts: [],
          },
          {
            id: "equipment-2",
            code: "EQ-002",
            conflicts: [],
          },
        ],
      });

      expect(ruleEquipmentFree(ctx)).toBeNull();
    });
  });

  describe("ruleSkillHeld", () => {
    it("allows a work order with no required skills", () => {
      const ctx = buildContext();

      expect(ruleSkillHeld(ctx)).toBeNull();
    });

    it("allows a technician holding the required skill", () => {
      const ctx = buildContext({
        workOrder: {
          requiredSkillIds: ["skill-1"],
        },
        technician: {
          skills: [
            {
              skillId: "skill-1",
              certifiedUntil: at("23:59", "2026-08-28"),
            },
          ],
        },
      });

      expect(ruleSkillHeld(ctx)).toBeNull();
    });

    it("rejects a missing required skill", () => {
      const ctx = buildContext({
        workOrder: {
          requiredSkillIds: ["skill-1"],
        },
      });

      const violation = ruleSkillHeld(ctx);

      expect(violation?.code).toBe("SKILL_NOT_HELD");
    });

    it("rejects an expired certification", () => {
      const ctx = buildContext({
        workOrder: {
          requiredSkillIds: ["skill-1"],
        },
        technician: {
          skills: [
            {
              skillId: "skill-1",
              certifiedUntil: at("23:59", "2026-08-27"),
            },
          ],
        },
      });

      const violation = ruleSkillHeld(ctx);

      expect(violation?.code).toBe("SKILL_EXPIRED");
    });

    it("allows certification that expires on the work date", () => {
      const ctx = buildContext({
        workOrder: {
          requiredSkillIds: ["skill-1"],
        },
        technician: {
          skills: [
            {
              skillId: "skill-1",
              certifiedUntil: at("23:59", "2026-08-28"),
            },
          ],
        },
      });

      expect(ruleSkillHeld(ctx)).toBeNull();
    });

    it("allows a certification with no expiry", () => {
      const ctx = buildContext({
        workOrder: {
          requiredSkillIds: ["skill-1"],
        },
        technician: {
          skills: [
            {
              skillId: "skill-1",
              certifiedUntil: null,
            },
          ],
        },
      });

      expect(ruleSkillHeld(ctx)).toBeNull();
    });
  });

  describe("ruleTravelTime", () => {
    it("allows an assignment with no previous job", () => {
      const ctx = buildContext({
        travelEstimate: {
          minutes: 30,
          source: "routing",
        },
      });

      expect(ruleTravelTime(ctx)).toBeNull();
    });

    it("allows a gap equal to travel time", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("11:30"),
          endsAt: at("13:00"),
        },
        technician: {
          sameDayAssignments: [
            {
              workOrderReference: "WO-2026-0002",
              startsAt: at("08:00"),
              endsAt: at("11:00"),
              site: {
                latitude: 9.03,
                longitude: 38.75,
              },
            },
          ],
        },
        travelEstimate: {
          minutes: 30,
          source: "routing",
        },
      });

      expect(ruleTravelTime(ctx)).toBeNull();
    });

    it("rejects a gap one minute shorter than travel time", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("11:29"),
          endsAt: at("13:00"),
        },
        technician: {
          sameDayAssignments: [
            {
              workOrderReference: "WO-2026-0002",
              startsAt: at("08:00"),
              endsAt: at("11:00"),
              site: {
                latitude: 9.03,
                longitude: 38.75,
              },
            },
          ],
        },
        travelEstimate: {
          minutes: 30,
          source: "routing",
        },
      });

      const violation = ruleTravelTime(ctx);

      expect(violation?.code).toBe("INSUFFICIENT_TRAVEL_TIME");
    });

    it("ignores unknown travel estimates", () => {
      const ctx = buildContext({
        travelEstimate: {
          minutes: 999,
          source: "unknown",
        },
      });

      expect(ruleTravelTime(ctx)).toBeNull();
    });

    it("uses the most recent prior assignment", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("14:00"),
          endsAt: at("16:00"),
        },
        technician: {
          sameDayAssignments: [
            {
              workOrderReference: "WO-2026-0001",
              startsAt: at("08:00"),
              endsAt: at("09:00"),
              site: {
                latitude: 9.03,
                longitude: 38.75,
              },
            },
            {
              workOrderReference: "WO-2026-0002",
              startsAt: at("12:00"),
              endsAt: at("13:30"),
              site: {
                latitude: 9.04,
                longitude: 38.76,
              },
            },
          ],
        },
        travelEstimate: {
          minutes: 30,
          source: "routing",
        },
      });

      expect(ruleTravelTime(ctx)).toBeNull();
    });
  });

  describe("ruleDailyHours", () => {
    it("allows a technician below the daily limit", () => {
      const ctx = buildContext({
        technician: {
          maxDailyMinutes: 480,
          sameDayAssignments: [
            {
              workOrderReference: "WO-2026-0002",
              startsAt: at("08:00"),
              endsAt: at("14:00"),
              site: {
                latitude: 9.03,
                longitude: 38.75,
              },
            },
          ],
        },
        proposed: {
          startsAt: at("15:00"),
          endsAt: at("16:00"),
        },
      });

      expect(ruleDailyHours(ctx)).toBeNull();
    });

    it("allows exactly 480 minutes", () => {
      const ctx = buildContext({
        technician: {
          maxDailyMinutes: 480,
          sameDayAssignments: [
            {
              workOrderReference: "WO-2026-0002",
              startsAt: at("08:00"),
              endsAt: at("14:00"),
              site: {
                latitude: 9.03,
                longitude: 38.75,
              },
            },
          ],
        },
        proposed: {
          startsAt: at("14:00"),
          endsAt: at("16:00"),
        },
      });

      expect(ruleDailyHours(ctx)).toBeNull();
    });

    it("rejects 481 minutes", () => {
      const ctx = buildContext({
        technician: {
          maxDailyMinutes: 480,
          sameDayAssignments: [
            {
              workOrderReference: "WO-2026-0002",
              startsAt: at("08:00"),
              endsAt: at("15:00"),
            },
          ],
        },
        proposed: {
          startsAt: at("15:00"),
          endsAt: at("16:01"),
        },
      });

      const violation = ruleDailyHours(ctx);

      expect(violation?.code).toBe("DAILY_HOURS_EXCEEDED");

      expect(violation?.context?.totalMinutes).toBe(481);
    });

    it("allows a custom daily limit", () => {
      const ctx = buildContext({
        technician: {
          maxDailyMinutes: 600,
          sameDayAssignments: [],
        },
        proposed: {
          startsAt: at("10:00"),
          endsAt: at("20:00"),
        },
      });

      expect(ruleDailyHours(ctx)).toBeNull();
    });

    it("marks daily hours violations as overridable", () => {
      const ctx = buildContext({
        technician: {
          maxDailyMinutes: 60,
        },
        proposed: {
          startsAt: at("10:00"),
          endsAt: at("12:00"),
        },
      });

      const violation = ruleDailyHours(ctx);

      expect(violation?.overridable).toBe(true);
    });
  });

  describe("checkAssignment", () => {
    it("allows a valid assignment", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("10:00"),
          endsAt: at("12:00"),
        },
        travelEstimate: {
          minutes: 15,
          source: "routing",
        },
      });

      const result = checkAssignment(ctx, at("09:00"));

      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("returns multiple violations", () => {
      const ctx = buildContext({
        workOrder: {
          status: "CANCELLED",
          requiredSkillIds: ["skill-1"],
        },
        technician: {
          skills: [],
          maxDailyMinutes: 60,
        },
        proposed: {
          startsAt: at("08:00"),
          endsAt: at("12:00"),
        },
        equipment: [
          {
            id: "equipment-1",
            code: "EQ-001",
            conflicts: [
              {
                workOrderReference: "WO-2026-0002",
              },
            ],
          },
        ],
      });

      const result = checkAssignment(ctx, at("09:00"));

      expect(result.allowed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(1);
    });

    it("returns allowed false when any rule fails", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("08:00"),
          endsAt: at("12:00"),
        },
      });

      const result = checkAssignment(ctx, at("09:00"));

      expect(result.allowed).toBe(false);
      expect(result.violations.some((v) => v.code === "SCHEDULE_IN_PAST")).toBe(true);
    });

    it("does not depend on the system clock", () => {
      const ctx = buildContext({
        proposed: {
          startsAt: at("10:00"),
          endsAt: at("12:00"),
        },
      });

      const result = checkAssignment(ctx, at("09:00"));

      expect(result.allowed).toBe(true);
    });
  });
});
