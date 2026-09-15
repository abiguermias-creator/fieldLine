# Fieldline

> A field-service operations platform for managing work orders, technicians, scheduling, equipment, and service delivery.

Fieldline is a full-stack field-service management system designed around the operational problems that arise when dispatchers need to coordinate technicians, equipment, travel, skills, certifications, and work-order priorities.

The project combines a React web application with a TypeScript/Express API, PostgreSQL, Redis-backed background processing, and resilient external integrations.

## What Fieldline Does

Fieldline connects the main roles involved in field operations:

- **Clients** — manage service requests, sites, and work orders.
- **Dispatchers** — assign technicians, coordinate schedules, and manage operational workload.
- **Technicians** — view daily assignments and complete field work.
- **Supervisors** — monitor operations and verify completed work.

### Core Capabilities

- Work order creation, assignment, tracking, and completion
- Technician scheduling based on skills and certifications
- Equipment-aware assignment and conflict prevention
- Technician daily workflow
- Client and site management
- Dispatcher operational board
- Supervisor verification workflow
- SLA-aware work-order handling
- Route and travel-time estimation
- Geocoding and weather integrations
- Redis caching and rate limiting
- Durable background jobs with BullMQ
- Structured operational logging and request correlation
- Append-only work-order event history

## Engineering Highlights

Fieldline is designed to demonstrate engineering beyond basic CRUD functionality.

### Scheduling Rules

Scheduling logic is implemented as a dedicated, testable domain layer rather than being buried inside HTTP controllers.

The scheduling engine considers:

- Technician availability
- Required skills
- Certification validity
- Equipment conflicts
- Technician conflicts
- Existing assignments
- Travel time
- Site coordinates
- Daily workload limits

The scheduling rules include **40+ boundary-focused unit tests** covering conflict and edge-case behavior.

### Resilient External Integrations

External services are accessed through a shared resilient HTTP client.

The integration layer provides:

- Request timeouts
- Retry handling for transient failures
- Protection against retrying normal client errors
- Jitter between retries
- Structured logging
- Fallback behavior

For routing, Fieldline can fall back to straight-line distance calculations when the routing provider is unavailable.

### Background Processing

Long-running or failure-prone work is moved out of the Express request lifecycle.

BullMQ workers handle operations such as:

- Email processing
- Geocoding
- Report/CSV generation
- Retryable asynchronous work

The job system includes retry handling, exponential backoff, idempotency considerations, dead-letter handling, and graceful shutdown behavior.

### Observability

The API uses structured logging with request correlation.

Important operational behavior includes:

- JSON logs
- Request IDs
- Redacted sensitive fields
- Domain-specific errors
- Centralized error handling
- Append-only work-order events

This makes failures easier to trace across API requests and background operations.

### Caching and Rate Limiting

Redis is used for performance and operational protection.

Examples include:

- Geocoding cache
- Routing cache
- API rate limiting
- Background job queues

Database constraints are also used to prevent invalid scheduling states such as equipment double-booking.

## Technology Stack

### Frontend

- React
- React Router
- Material UI
- Vite
- TanStack Query
- Leaflet / React Leaflet

### Backend

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Zod
- Pino
- Supertest
- Vitest

### Infrastructure & Processing

- Redis
- BullMQ
- Neon PostgreSQL
- Vercel
- Render

### External Integrations

- Nominatim — geocoding
- OSRM — routing and travel-time estimation
- Open-Meteo — weather information

## Architecture

Fieldline is organized as an npm workspace monorepo:

```text
fieldLine/
├── apps/
│   ├── api/              # Express API, Prisma, workers, integrations
│   └── web/              # React frontend
│
├── packages/
│   └── shared/           # Shared types and domain utilities
│
├── docs/                 # Architecture and development documentation
│
├── .github/              # CI configuration
│
├── package.json
└── README.md
```

The API separates responsibilities across routes/controllers, services, integrations, infrastructure utilities, and background workers.

The frontend is organized around authenticated application routes, role-aware navigation, reusable components, and dedicated workflow pages.

## Role Model

| Role           | Main Responsibilities                         |
| -------------- | --------------------------------------------- |
| **CLIENT**     | Submit and track service requests             |
| **DISPATCHER** | Manage work orders and technician assignments |
| **TECHNICIAN** | View assignments and perform field work       |
| **SUPERVISOR** | Monitor operations and verify completed work  |

Protected routes enforce authentication, while role-specific operations are restricted through server-side authorization.

## Scheduling Model

Fieldline uses service priorities and SLA expectations when handling work orders.

| Priority | Response Target | Resolution Target |
| -------- | --------------- | ----------------- |
| **P1**   | 1 hour          | 4 hours           |
| **P2**   | 4 hours         | 24 hours          |
| **P3**   | 24 hours        | 5 days            |
| **P4**   | Scheduled       | Scheduled         |

Work-order references follow the format:

```text
WO-{year}-{4 digits}
```

Assignments are checked against technician skills, certifications, availability, equipment conflicts, existing schedules, travel considerations, and operational constraints.

## Demo Accounts

The development seed creates demo accounts for the main Fieldline roles.

| Role       | Email                      |
| ---------- | -------------------------- |
| Dispatcher | `admin@fieldline.com`      |
| Technician | `technician@fieldline.com` |
| Supervisor | `supervisor@fieldline.com` |
| Client     | `client@abc.com`           |

**Demo password:**

```text
password123
```

These accounts are intended for local/demo evaluation.

## Running Locally

### Prerequisites

Install:

- Node.js
- npm
- PostgreSQL-compatible database
- Redis for caching and background workers

### Install dependencies

```powershell
npm install
```

### Configure the API

Create the required environment configuration for the API according to:

```text
docs/06-development-setup.md
```

### Generate the database client and apply migrations

```powershell
npm run db:migrate
```

### Seed demo data

```powershell
npm run db:seed
```

### Start development

Run the full development environment:

```powershell
npm run dev
```

The web application runs through Vite and the API runs separately through the workspace development scripts.

## Useful Commands

### Type checking

```powershell
npm run typecheck
```

### Tests

```powershell
npm test
```

### Linting

```powershell
npm run lint
```

### Build

```powershell
npm run build
```

### Database studio

```powershell
npm run db:studio
```

### API development

```powershell
npm run dev:api
```

### Web development

```powershell
npm run dev:web
```

## Development Stages

The project was progressively hardened beyond the initial application features.

### Stage 1 — Scheduling Core

Extracted scheduling decisions into a pure domain layer with extensive boundary testing.

### Stage 2 — Observability

Added structured logging, request correlation, domain errors, centralized error handling, and work-order events.

### Stage 3 — Resilient Integrations

Introduced shared HTTP resilience with timeouts, retries, logging, and routing fallbacks.

### Stage 4 — Caching & Rate Limiting

Added Redis caching, rate limiting, routing/geocoding caches, and database-level scheduling protection.

### Stage 5 — Background Jobs

Moved durable asynchronous work into BullMQ workers with retries, backoff, idempotency handling, dead-letter processing, and graceful shutdown.

## Testing

The project includes automated tests for important backend behavior, particularly scheduling and infrastructure resilience.

Examples include:

- Scheduling conflict boundaries
- Skill and certification validation
- Equipment conflicts
- HTTP retry behavior
- Timeout handling
- Integration fallback behavior

Run the test suite with:

```powershell
npm test
```

## Documentation

Additional development and architecture documentation is available in:

```text
docs/
```

Key architectural decisions are recorded in:

```text
docs/decisions.md
```

Development setup instructions are available in:

```text
docs/06-development-setup.md
```

## Project Status

Fieldline is a portfolio project focused on demonstrating practical full-stack engineering, domain modeling, operational reliability, and production-oriented backend design.

The project is actively being polished for professional review, including documentation, screenshots, repository cleanup, and deployment readiness.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
