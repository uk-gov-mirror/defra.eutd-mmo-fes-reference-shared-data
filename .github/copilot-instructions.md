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

## Standards precedence (highest wins)

When guidance conflicts, follow this order:

1. **DEFRA Software Development Standards** (mandatory) — https://defra.github.io/software-development-standards/
2. **DEFRA Digital Service Manual** — https://digital.defra.gov.uk/service-manual
3. **GOV.UK Service Standard & Service Manual (GDS)** — https://www.gov.uk/service-manual
4. **Community best practice** — [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/), [12-factor](https://12factor.net/), widely-adopted Node.js/TypeScript patterns

> **DEFRA takes precedence over GDS. GDS takes precedence over community guidance.** Any deviation from a DEFRA standard MUST be raised as a formal exception through DEFRA's architectural governance (Delivery Architecture team: `delivery.architecture@defra.gov.uk`).

## The working framework (Triage → Read → Research → Clarify → Plan → Approval → Implement → Test → Iterate → Summarise)

This section is the **single source of truth** for the working loop. The custom agents ([Orchestrator](.github/agents/reference-shared-data-orchestrator.agent.md), [Planner](.github/agents/reference-shared-data-planner.agent.md), [Developer](.github/agents/reference-shared-data-developer.agent.md) and [Reviewer](.github/agents/reference-shared-data-reviewer.agent.md)) reference it and **must not restate or fork it**. The guiding principle is **match effort to risk**: do the least work that still delivers the change safely and to standard.

**Triage first — pick one of three gears by size and risk:**

- **Trivial** (typo, comment/doc tweak, a small localised change with no impact on the public API, transformations, shared types, external integrations, security or data correctness): skip the planner, research and review. Do a light **Read → Implement → Test → Summarise**, and research only the one point that is genuinely uncertain.
- **Standard** (a normal transformation/type change or fix, with **no** new architecture, public-API/barrel-export change, external integration, or security surface): use a **lightweight inline plan** (a short Objective · Plan · Files · Validation · Risks note from the Developer agent — no heavyweight Planner), get approval, then implement and test. Run a **single** risk-scoped research pass **only if** something is genuinely uncertain.
- **Complex** (new architecture, a public-API/barrel-export change, a new external integration (CEFAS/Boomi, Azure Service Bus), a security surface, or multi-item delivery): run the full loop with the Planner agent below.

**Manual override.** The user can force a gear — e.g. "treat this as trivial", "just a lightweight/standard plan", "force the full plan", "skip the planner" — and that instruction wins over the automatic classification. Always honour a request for **more** rigour. When the user asks for **less** rigour than the risk warrants, comply but **briefly flag the risk first**, and never drop the approval gate or security for a change that genuinely touches architecture, the public API, external integrations, security or data correctness.

The loop (Standard and Complex; Trivial uses the light path above):

1. **Read** — Read the relevant files/config in the repo for context before acting. Never assume; verify.
2. **Research (single pass, risk-scoped)** — When something is genuinely uncertain — an unfamiliar or version-sensitive API, security, or DEFRA/GDS policy — do **one** thorough, risk-scoped research pass in the open and validate findings against DEFRA/GDS and framework/library guidance so advice reflects current APIs and policy. Cite sources. **Do not run a second, separate validation research round** — the plan is checked against these same cited sources. Well-trodden or cosmetic steps need little or no research.
3. **Clarify** — Ask the user targeted questions whenever requirements are ambiguous or missing. Surface requirement gaps explicitly with suggested fixes. Do not guess at intent.
4. **Plan** — For **Complex** work, delegate planning to the [Planner - Shared Reference Data](.github/agents/reference-shared-data-planner.agent.md) agent, which returns a complete plan with its research already cited. For **Standard** work, produce the lightweight inline plan directly — no separate planning agent. Either way, **check** the plan's risky/version-sensitive steps are covered and cited; only send a targeted revision back if a genuine gap is found (do not re-research what is already cited).
5. **Approval** — Present the plan to the user and obtain explicit approval before implementation. If changes are requested, update the plan and re-present. **Cap the plan → approve → implement cycle at 3 iterations**; if it is still unresolved, stop and surface the blocker to the user.
6. **Implement** — Deliver one task at a time (or parallel independent tasks) from the approved plan. Stay focused on the requested outcome; do not scope-creep or refactor unrelated code. When a change introduces or alters architecture (or the public API), capture the decision as an ADR and update the relevant docs and ADRs **where the repo already keeps them** (e.g. `docs/`).
7. **Test / Validate** — Build (`npm run build`), run the test suite (`npm test`), lint (`npm run lint`), check errors, and confirm each task works before moving on.
8. **Iterate** — Refine until the user is satisfied with each task.
9. **Summarise** — End with a detailed **executive summary** of what changed, why, how it was validated, and any follow-ups or risks.

**Code review is optional and on-request.** A full code review is **not** part of the default loop. Run it only when the user asks for one. At the end of implementation, if no review has been run, **offer** one (a single Yes/No question); invoke the reviewer only on an explicit Yes.

## Workflow agents

Standard and Complex work is coordinated through four custom agents that all run the framework above:

| Agent | Role |
|-------|------|
| [Orchestrator - Shared Reference Data](.github/agents/reference-shared-data-orchestrator.agent.md) | Plans, delegates, verifies and reports; owns the Yes/No user-approval gate and the end-of-work review offer. Does **not** implement. |
| [Planner - Shared Reference Data](.github/agents/reference-shared-data-planner.agent.md) | Internal planning subagent; produces the approval-ready plan and the single research pass behind it. Invoked for **Complex** work. |
| [Developer - Shared Reference Data](.github/agents/reference-shared-data-developer.agent.md) | Implements an already-approved plan end-to-end with tests; authors the lightweight inline plan for **Standard** work. |
| [Reviewer - Shared Reference Data](.github/agents/reference-shared-data-reviewer.agent.md) | Read-only review against DEFRA standards; reports findings by severity. **Optional, on-request only** — not run by default. |

Research (§4.2) uses the [deep-research-defra-alignment](.github/skills/deep-research-defra-alignment/SKILL.md) skill — a single risk-scoped pass run by the **Planner** (Complex work) or the **Developer** (Standard work). The [Speckit](.github/agents) agents (`speckit.*`) are a separate spec-driven toolset and are **not** part of this workflow.

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