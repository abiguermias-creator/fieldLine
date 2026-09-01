import type { ErrorCode } from "@fieldline/shared";

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class TechnicianUnavailableError extends DomainError {
  constructor(
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super("TECHNICIAN_UNAVAILABLE", message, 409, details);
    this.name = "TechnicianUnavailableError";
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super("INVALID_TRANSITION", message, 409, details);
    this.name = "InvalidTransitionError";
  }
}

export class WorkOrderClosedError extends DomainError {
  constructor(
    message = "This work order is closed and cannot be modified.",
  ) {
    super("WORK_ORDER_CLOSED", message, 409);
    this.name = "WorkOrderClosedError";
  }
}

export class WorkOrderNotFoundError extends DomainError {
  constructor(
    message = "Work order not found",
  ) {
    super("WORK_ORDER_NOT_ASSIGNABLE", message, 404);
    this.name = "WorkOrderNotFoundError";
  }
}