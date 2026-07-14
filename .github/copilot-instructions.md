# MMO Shared Reference Data - AI Coding Assistant Instructions

## Project Overview
This is a TypeScript library for DEFRA's Marine Management Organisation (MMO) that provides shared reference data services for fishing vessel landings, catch certificates, and regulatory compliance. It's distributed as an npm package to multiple MMO applications.

## Core Architecture

### Domain Structure
- **Landings**: Core domain around fishing vessel landings (`src/landings/`)
  - `orchestration/`: High-level business workflows (e.g., `ccOnlineReport.ts`)
  - `persistence/`: Data storage operations (`catchCert.ts`)
  - `query/`: Data retrieval and filtering (`ccQuery.ts`, `risking.ts`)
  - `transformations/`: Data mapping between external APIs and internal models
  - `types/`: TypeScript interfaces for domain models

### External Integration Points
- **CEFAS/Boomi API**: Primary data source for fishing activity via `BoomiService`
  - OAuth2 client credentials flow with legacy SSL support
  - Multiple resource types: `landing`, `catchActivity`, `salesNotes`, `eLogs`, `address`
  - Date handling: Always use UTC dates for CEFAS calls
- **Azure Service Bus**: Message queuing via `addToReportQueue()`
  - Dual mode: real queues (production) vs local filesystem (development)
  - Uses `sessionId` or `correlationId` for message tracking

## Development Patterns

### Testing Requirements
- **90% code coverage** enforced by Jest configuration
- Mock Azure Service Bus extensively using class-based mocks
- Test both success and error paths, especially for external integrations
- Use descriptive test names: `should add message to queue when enableReportToQueue is true`

### Logging Convention
Structured logging with bracketed context:
```typescript
logger.info(`[SERVICE][ACTION][QUEUE-NAME][DOCUMENT-NUMBER][${docNumber}][CORRELATION-ID][${correlationId}]`);
logger.error(`[SERVICE][ACTION][ERROR][CONTEXT][${error.stack || error}]`);
```

### Configuration Management
- Environment variables accessed via `getConfig()` in `src/config.ts`
- Prefix patterns: `REF_BOOMI_*` for Boomi, standard names for Azure
- OAuth scopes differ by resource type (address lookup vs MMO scope)

### Build & Distribution
- **tsup** for dual CommonJS/ESM builds with TypeScript declarations
- **GitFlow branching**: `main`, `develop`, `feature/*`, `hotfix/*`, `release/*`
- Azure DevOps pipeline triggered by branch patterns
- Published to internal npm feed (requires `.npmrc` configuration)

## Common Gotchas

### Date Handling
- CEFAS requires UTC dates in `YYYY-MM-DD` format
- Use `moment.utc(dateLanded).format('YYYY-MM-DD')` for API calls
- Validate dates with `moment(date).isValid()` before processing

### Service Bus Message Patterns
- Check `enableReportToQueue` flag before deciding queue vs filesystem
- Always extract correlation ID: `message?.sessionId || message?.correlationId`
- Handle missing parameters gracefully with detailed error logging

### Type Exports
- Re-export types through barrel exports (`index.ts` files)
- Maintain clear separation: `MessageLabel` enum vs `addToReportQueue` function
- Use specific type imports: `{ ServiceBusMessage, ServiceBusSender }`

### Error Handling
- Catch and re-throw with context in service layers
- Check for both `e.response` and direct error cases in Axios calls
- Use `SSL_OP_LEGACY_SERVER_CONNECT` for HTTPS agents with legacy systems

## Working with Tests
- Run `npm test` for single run with coverage
- Use `npm run test:watch` for development
- Mock external dependencies at module level, not inline
- Test file naming: `*.spec.ts` for unit tests, `*.jest.spec.ts` for complex mocks

## Skills

Use `/develop` for implementation, coding, and research tasks. Use `/unit-tests` for writing tests, coverage, and SonarQube issues.

## Defra standards and governance

This library must comply with [Defra software development standards](https://github.com/DEFRA/software-development-standards) — the single source of truth. The rules below encode those standards; they do not replace them. When a standard changes, update this file.

### Quality gates

All code must pass these checks before merging:

- Linter passes (`npm run lint`)
- All tests pass (`npm test`)
- Coverage ≥90% global (Statements/Branches/Functions/Lines), ≥95% core business logic, 100% error-handling and security-critical paths — no decrease from the SonarCloud baseline
- SonarQube/SonarCloud quality gate passes; security hotspots reviewed and resolved
- At least one approving review from another developer
- No unresolved security vulnerabilities in dependencies

### Security and PII

- Follow [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- Never commit secrets — load all configuration and credentials from environment variables (`src/config.ts`), never `process.env` scattered through code
- **Never log PII**: names, addresses, emails, phone numbers, NI numbers, bank details, usernames, passwords, API keys, tokens
- Validate and sanitise all external input; use parameterised queries for database access
- Avoid `eval`, dynamic `Function()`, or executing user-supplied data; validate and normalise file paths

### Dependencies

- New dependencies must be widely used, actively maintained, and compatible with the current Node.js LTS
- This library is the SSOT for shared types and queries consumed by other FES services — keep its public API stable and versioned
- Do not introduce a second HTTP client, ORM, or date library without an approved exception

### Logging

- Structured logging via `bunyan` with bracketed context tags and correlation-id propagation
- Levels: `error` (failures), `warn` (handled but unexpected), `info` (business events), `debug` (development only)

### How Copilot should respond

- Follow conventions already in the codebase — check existing patterns first
- Prefer modifying existing files over creating new ones when the change fits naturally
- Provide minimal diffs touching only the necessary files; do not refactor unrelated code
- Always include or update tests for changed behaviour
- Export new types and functions through the barrel exports (`index.ts`) so consumers can import them
- If a request conflicts with these instructions — a discouraged library, a skipped test, a hard-coded secret, or a broken quality gate — flag it explicitly and do not proceed silently

### Licence

All code is published under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) unless an approved exception exists.

<!-- STANDARDS NOTE: These instructions reflect Defra software development standards (https://github.com/DEFRA/software-development-standards). Review this file periodically or after any Defra standards update. -->