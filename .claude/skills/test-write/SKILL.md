---
name: test-write
description: Write high-quality tests for existing code. Enforces behavior-through-interface testing, no implementation coupling.
---

# Write Tests for Existing Code

The code already exists. Write tests that verify behavior through the public interface — tests that survive refactors and catch real regressions.

## Before Writing Any Tests

1. **Read the code under test** — understand what it does, not how
2. **Identify the public interface** — those are your test subjects
3. **List the behaviors** — what observable outcomes does this code produce?
4. **Confirm with the user** — "Here are the behaviors I plan to test: [...]. Anything I'm missing?"

## Writing Tests

Write tests **one at a time**. Run each test after writing it.

```
Write test 1 → run → passes? → next
```

Why: each test teaches you something, you catch test bugs immediately, you avoid testing imagined behavior.

## Test Quality Rules

See [tests.md](tests.md) for full examples and [mocking.md](mocking.md) for mocking guidelines.

**Every test must:**
- Test behavior, not implementation — describe WHAT the system does for callers
- Use public interface only — never import private/internal modules
- Survive refactors — if internals change but behavior stays, this test passes
- Test one behavior — not a grab bag of checks
- Have a descriptive name — reads like a spec: "finds a show by Arabic title"
- Use precise assertions — exact values when the expected result is known

**Red flags — stop and rethink:**
- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Loose assertions when exact values are known (`toBeGreaterThan(0)` when you know it's `3`)

## Mocking

**Mock at system boundaries only:** external APIs, time/randomness. **Never mock** your own classes or anything you can run for real. Prefer real infrastructure (Docker OpenSearch, real HTTP server) over mocks.

## Test Data

- Seed realistic data, not `"test123"` placeholders
- Each test owns its assertions (tests must be independent)
- Use `beforeAll`/`afterAll` for shared state

## Structure

```typescript
describe("what you're testing (noun)", () => {
  it("behavior description (verb phrase)", async () => {
    // Arrange → Act → Assert
  });
});
```

Group by feature/capability, not by method name.
