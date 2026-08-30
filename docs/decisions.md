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
