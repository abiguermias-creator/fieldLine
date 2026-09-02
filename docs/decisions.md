# Architecture Decision: Pure Scheduling Core

## Decision

Fieldline scheduling business rules are implemented in a pure TypeScript module at:

`apps/api/src/services/scheduling.ts`

The database-dependent work order service loads the required data and builds an `AssignmentContext`. The pure scheduling core then evaluates the assignment using:

`checkAssignment(context, now)`

The result contains whether the assignment is allowed and any rule violations.

## Pure Core

The scheduling core does not:

- access Prisma or the database
- make HTTP or network requests
- read the system clock
- modify external state

The current time is passed explicitly through the `now` parameter so time-dependent rules can be tested deterministically.

## Impure Shell

`apps/api/src/work-orders/work-order.service.ts` remains responsible for:

- loading technicians, equipment, skills, sites, and assignments
- constructing the scheduling context
- handling supervisor overrides
- persisting work order and assignment changes
- recording events

## Reason

Separating business decisions from database I/O makes the scheduling rules fast, deterministic, and easy to test. The 40+ Vitest unit tests can exercise boundary conditions without PostgreSQL, HTTP requests, or browser interaction.

This also reduces the risk of regressions in scheduling rules such as technician conflicts, skill expiry, travel feasibility, and daily working-hour limits.

## Architecture Decision: Observability, Correlation, and Error Handling

### Decision

The API uses Pino for structured JSON logging and `x-request-id` correlation.

Every incoming request receives a request ID. If the client provides a non-empty
`x-request-id` header, that ID is reused; otherwise, the API generates a ULID.
The ID is attached to the Express request, returned in the response header, and
included in request logging.

The Pino logger automatically redacts sensitive fields such as passwords,
password hashes, authorization headers, tokens, and refresh tokens before they
are written to the log stream.

Domain failures use a shared `DomainError` hierarchy. The centralized Express
`errorHandler` converts domain errors and validation errors into consistent
error envelopes containing an error code, message, details, and request ID.

### Reason

Structured logs make production failures searchable and machine-readable while
request IDs allow all log entries for a single HTTP request to be correlated.

Automatic redaction prevents credentials and authentication tokens from being
written to logs.

Centralized error handling keeps HTTP error responses consistent and removes
duplicated error-formatting logic from individual route handlers.
