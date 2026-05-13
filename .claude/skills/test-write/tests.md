# Good and Bad Tests

## Good Tests

**Integration-style**: Test through real interfaces, not mocks of internal parts.

```typescript
// GOOD: Tests observable behavior through public API
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

```typescript
// GOOD: Verifies through the same interface callers use
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

```typescript
// GOOD: Tests a specific behavior with a precise assertion
test("finds a show by Arabic title", async () => {
  const result = await searchService.search("shows", { query: "فنجان" });
  expect(result.hits).toHaveLength(1);
  expect(result.hits[0]?.id).toBe("show_fnjan");
});
```

```typescript
// GOOD: Tests ranking behavior — a real user concern
test("ranks higher-popularity shows first when both match", async () => {
  const result = await searchService.search("shows", { query: "بودكاست" });
  const ids = result.hits.map((h) => h.id);
  const fnjanIndex = ids.indexOf("show_fnjan");
  const swalefIndex = ids.indexOf("show_swalef");
  expect(fnjanIndex).toBeLessThan(swalefIndex);
});
```

Characteristics:
- Tests behavior users/callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test
- Precise: uses exact values when the answer is known

## Bad Tests

**Implementation-detail tests**: Coupled to internal structure.

```typescript
// BAD: Tests implementation details
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

```typescript
// BAD: Bypasses interface to verify
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});
```

```typescript
// BAD: Loose assertion when exact value is known
test("finds shows", async () => {
  const result = await searchService.search("shows", { query: "فنجان" });
  expect(result.hits.length).toBeGreaterThanOrEqual(1); // we know it's exactly 1
  expect(result.took).toBeGreaterThanOrEqual(0);        // testing OpenSearch internals
});
```

```typescript
// BAD: Tests implementation detail (which clauses the builder generates)
test("builds 9 query clauses", () => {
  const builder = new QueryBuilder("shows");
  builder.withKeyword("فنجان");
  const query = builder.build();
  expect(query.query.bool.should).toHaveLength(9);
});
```

Red flags:
- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means instead of interface
- Loose assertions when exact values are known
- Testing framework behavior (does OpenSearch return JSON?)
- Testing internal query structure instead of search results
