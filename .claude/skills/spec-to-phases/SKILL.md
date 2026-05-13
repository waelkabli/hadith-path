---
name: spec-to-phases
description: Turn a spec into a multi-phase implementation plan using tracer-bullet vertical slices, saved locally to .specs/. Use when user wants to break down a spec, create an implementation plan, plan phases from a spec, or mentions "tracer bullets".
---

# Spec to Phases

Break a spec into a phased implementation plan using vertical slices (tracer bullets). Output is a Markdown file at `.specs/<feature-name>/phases.md`, alongside the spec it was derived from.

## Process

### 1. Load the spec

Look for the spec in `.specs/`. If multiple specs exist, ask the user which one. If none exist or the user wants a spec not yet written, point them to the `write-a-spec` skill first.

### 2. Explore the codebase

If you haven't already, explore the codebase to understand architecture, existing patterns, and integration layers relevant to this spec.

### 3. Identify durable architectural decisions

Before slicing, extract high-level decisions that are unlikely to change throughout implementation. Start with these categories but add domain-specific ones and remove irrelevant ones:

- Database schema shape
- Route structures / URL patterns
- Key data models
- Authentication / authorization approach
- Third-party service boundaries

Review the spec's **Implementation Decisions** section. Carry forward durable decisions. If you disagree with any, flag them to the user before proceeding.

### 4. Draft vertical slices

Break the spec into **tracer bullet** phases. Each phase is a thin vertical slice that cuts through ALL integration layers end-to-end.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
- A phase that only touches one layer (e.g., "set up the schema" or "build the API endpoints") is NOT a vertical slice — restructure it
- Do NOT include specific file names, function names, or implementation details likely to change as later phases are built
- DO include durable decisions: route paths, schema shapes, data model names
- Do NOT write test plans, tier labels, or test implementation details in phases. Tests are written separately using the `test-write` skill after each phase is implemented. Phases describe WHAT to build and acceptance criteria, not HOW to test.
</vertical-slice-rules>

### 5. Reconcile against the spec

Before presenting to the user, verify that **every user story** from the spec is covered by at least one phase. If any stories are not covered, either:

- Add them to an existing phase, or
- Create a new phase, or
- Explicitly list them as deferred with rationale

### 6. Draft manual QA plans

For each phase, write a **Manual QA plan** — a concrete checklist of items that require human verification after the phase is implemented. These are things automated tests can't fully cover: visual correctness, UX feel, real-device behavior, cross-browser quirks, third-party integration sanity, data migration spot-checks, etc.

<manual-qa-rules>
- Each QA item should be a specific, actionable step a human can follow (not vague like "verify it works")
- Include the exact route/page/command to visit, the input to provide, and what the expected outcome looks like
- Cover the happy path AND meaningful edge cases (empty states, error states, boundary values)
- If the phase integrates with a third-party service, include a step to verify the real integration (not just mocks)
- If the phase touches UI, include visual/layout checks with specific viewport or device expectations
- Keep each item self-contained — a QA tester unfamiliar with the codebase should be able to follow it
</manual-qa-rules>

### 7. Quiz the user

Present the proposed breakdown as a numbered list. For each phase show:

- **Title**: short descriptive name
- **User stories covered**: which user stories from the spec this addresses
- **Depends on**: which prior phases must be complete (if any)

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Should any phases be merged or split further?
- Are the dependencies correct? Can anything be parallelized?

Iterate until the user approves the breakdown.

### 8. Write the phases file

Write the plan to `.specs/<feature-name>/phases.md` (same directory as the spec). Use the template below.

<phases-template>
# Phases: <Feature Name>

> Source spec: .specs/<feature-name>/spec.md

## Architectural Decisions

Durable decisions that apply across all phases:

- **Schema**: ...
- **Routes**: ...
- **Key models**: ...
- (add/remove sections as appropriate)

---

## Phase 1: <Title>

**User stories**: #1, #3, #5 (from spec)
**Depends on**: — (none)

### What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation. Do NOT include a "Tests" subsection — tests are written separately via the `test-write` skill after the phase is implemented.

### Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Manual QA plan

Items requiring human verification after this phase is complete:

1. **<Action to perform>**: Navigate to / run `...`, provide `...` as input. **Expected**: describe what the tester should see or experience.
2. **<Edge case>**: Try `...` with empty / invalid / boundary input. **Expected**: describe graceful behavior.
3. ...

---

## Phase 2: <Title>

**User stories**: #2, #4 (from spec)
**Depends on**: Phase 1

### What to build

...

### Acceptance criteria

- [ ] ...

### Manual QA plan

Items requiring human verification after this phase is complete:

1. ...

---

<!-- Repeat for each phase -->

## Deferred Stories

User stories from the spec not covered by any phase:

- **Story #N**: <reason for deferral>

(Remove this section if all stories are covered.)
</phases-template>
