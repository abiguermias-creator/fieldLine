import { describe, expect, it } from "vitest";

import {
  canTransition,
  TRANSITIONS,
  WORK_ORDER_STATUSES,
} from "@fieldline/shared";

describe("work order status transitions", () => {
  describe("canTransition", () => {
    it("allows NEW to TRIAGED", () => {
      expect(canTransition("NEW", "TRIAGED")).toBe(true);
    });

    it("allows TRIAGED to SCHEDULED", () => {
      expect(canTransition("TRIAGED", "SCHEDULED")).toBe(true);
    });

    it("allows SCHEDULED to ASSIGNED", () => {
      expect(canTransition("SCHEDULED", "ASSIGNED")).toBe(true);
    });

    it("allows ASSIGNED to EN_ROUTE", () => {
      expect(canTransition("ASSIGNED", "EN_ROUTE")).toBe(true);
    });

    it("allows EN_ROUTE to ON_SITE", () => {
      expect(canTransition("EN_ROUTE", "ON_SITE")).toBe(true);
    });

    it("allows ON_SITE to IN_PROGRESS", () => {
      expect(canTransition("ON_SITE", "IN_PROGRESS")).toBe(true);
    });

    it("allows IN_PROGRESS to COMPLETED", () => {
      expect(canTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
    });

    it("allows IN_PROGRESS to ON_HOLD", () => {
      expect(canTransition("IN_PROGRESS", "ON_HOLD")).toBe(true);
    });

    it("allows IN_PROGRESS to AWAITING_PARTS", () => {
      expect(canTransition("IN_PROGRESS", "AWAITING_PARTS")).toBe(true);
    });

    it("allows COMPLETED to VERIFIED", () => {
      expect(canTransition("COMPLETED", "VERIFIED")).toBe(true);
    });

    it("allows VERIFIED to CLOSED", () => {
      expect(canTransition("VERIFIED", "CLOSED")).toBe(true);
    });

    it("allows ASSIGNED to SCHEDULED", () => {
      expect(canTransition("ASSIGNED", "SCHEDULED")).toBe(true);
    });

    it("allows ASSIGNED to CANCELLED", () => {
      expect(canTransition("ASSIGNED", "CANCELLED")).toBe(true);
    });

    it("rejects NEW directly to ASSIGNED", () => {
      expect(canTransition("NEW", "ASSIGNED")).toBe(false);
    });

    it("rejects TRIAGED directly to COMPLETED", () => {
      expect(canTransition("TRIAGED", "COMPLETED")).toBe(false);
    });

    it("rejects SCHEDULED directly to COMPLETED", () => {
      expect(canTransition("SCHEDULED", "COMPLETED")).toBe(false);
    });

    it("rejects EN_ROUTE directly to COMPLETED", () => {
      expect(canTransition("EN_ROUTE", "COMPLETED")).toBe(false);
    });

    it("rejects ON_SITE directly to COMPLETED", () => {
      expect(canTransition("ON_SITE", "COMPLETED")).toBe(false);
    });

    it("rejects IN_PROGRESS directly to VERIFIED", () => {
      expect(canTransition("IN_PROGRESS", "VERIFIED")).toBe(false);
    });

    it("rejects VERIFIED directly to COMPLETED", () => {
      expect(canTransition("VERIFIED", "COMPLETED")).toBe(false);
    });

    it("does not allow CLOSED to transition anywhere", () => {
      for (const status of WORK_ORDER_STATUSES) {
        expect(canTransition("CLOSED", status)).toBe(false);
      }
    });

    it("does not allow CANCELLED to transition anywhere", () => {
      for (const status of WORK_ORDER_STATUSES) {
        expect(canTransition("CANCELLED", status)).toBe(false);
      }
    });
  });

  describe("TRANSITIONS", () => {
    it("defines transitions for every work order status", () => {
      for (const status of WORK_ORDER_STATUSES) {
        expect(TRANSITIONS[status]).toBeDefined();
      }
    });

    it("has no duplicate transition targets", () => {
      for (const status of WORK_ORDER_STATUSES) {
        const transitions = TRANSITIONS[status];
        expect(new Set(transitions).size).toBe(transitions.length);
      }
    });
  });
});