---
name: write-a-spec
description: Create a feature spec through structured user interview, codebase exploration, and module design, saved locally to .specs/. Use when user wants to write a spec, create a feature specification, or plan a new feature.
---

# Write a Spec

Create a feature specification through structured interview and codebase exploration. Output is a Markdown file in `.specs/<feature-name>/spec.md`.

You may skip steps if you don't consider them necessary.

## Process

### 1. Get the problem statement

Ask the user for a detailed description of the problem they want to solve and any initial ideas for solutions.

### 2. Light codebase scan

Do a structural scan of the repo — project layout, key directories, entry points, existing patterns. The goal is orientation, not deep understanding. Save deep dives for when the interview surfaces specific questions.

### 3. Interview by design axis

Interview the user to reach a shared understanding. Structure the conversation by **design axis** — one concern at a time:

- State the axis you're exploring (e.g., "Let's talk about data modeling" or "Let's talk about the user-facing behavior when X fails")
- Ask all your questions for that axis in a batch
- Summarize what you've agreed on before moving to the next axis
- Do targeted codebase exploration as specific questions arise during the interview

Resolve dependencies between decisions: if decision B depends on decision A, settle A first.

### 4. Identify modules

Sketch out the major modules you'll need to build or modify. Actively look for opportunities to extract **deep modules** — modules that encapsulate rich functionality behind a simple, testable interface that rarely changes (as opposed to shallow modules with large surface areas and thin implementations).

Check with the user:

- Do these modules match their expectations?
- Which modules should have tests?

### 5. Write the spec

Once you have a complete shared understanding, create `.specs/<feature-name>/` and write `spec.md` using the template below.

<spec-template>
# Spec: <Feature Name>

## Problem Statement

The problem from the user's perspective. What's broken, missing, or painful.

## Solution

The proposed solution from the user's perspective. What changes for them.

## User Stories

An exhaustive numbered list covering every distinct interaction path, including error cases and edge conditions. Each story follows the format:

1. As a <actor>, I want <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see the balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

## Acceptance Criteria

Top-level criteria that define when this feature is done. These are the conditions that must ALL be true for the spec to be considered fully implemented.

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Implementation Decisions

Decisions are ordered from most durable to most volatile.

### Architecture & Schema

Durable structural decisions: data models, schema shapes, system boundaries.

### Interfaces & Contracts

API contracts, module interfaces, route structures.

### Behavior & Interactions

Specific interaction patterns, state transitions, error handling approaches.

---

Do NOT include specific file paths or code snippets. They become outdated quickly.

## Testing Decisions

- Which modules will be tested
- What types of tests (unit, integration, end-to-end)
- Prior art in the codebase for similar tests

## Out of Scope

Features, edge cases, or user expectations that were explicitly discussed and deferred.

- **<Deferred item>**: <why it's deferred>
- **<Deferred item>**: <why it's deferred>

## Open Questions

Unresolved questions that surfaced during the interview but don't block implementation.

## Further Notes

Any additional context about the feature.
</spec-template>
