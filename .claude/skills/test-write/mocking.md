# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, third-party services)
- Time/randomness (when determinism matters)
- Network calls to services you don't control

**Never mock:**

- Your own classes/modules
- Internal collaborators
- Anything you control and can run for real

## Prefer Real Infrastructure

If you can run the real thing, run the real thing.

```typescript
// GOOD: Real OpenSearch in Docker
const client = getClient(); // connects to localhost:9200
const result = await searchService.search("shows", { query: "فنجان" });
expect(result.hits).toHaveLength(1);

// BAD: Mocked client
const mockClient = { search: vi.fn().mockResolvedValue({ body: { hits: { hits: [] } } }) };
const service = new SearchService(mockClient);
// This test proves nothing — you're testing your mock, not your code
```

```typescript
// GOOD: Real HTTP server
const response = await fetch("http://localhost:3000/api/v1/search/shows?q=فنجان");
const data = await response.json();
expect(data.data.hits).toHaveLength(1);

// BAD: Mocked route handler
const mockHandler = vi.fn().mockReturnValue({ data: null });
// Tests the mock, not the route
```

## When You Must Mock

At true system boundaries where real calls are impractical:

```typescript
// OK: External payment API — can't charge real cards in tests
const mockPayment = { charge: vi.fn().mockResolvedValue({ id: "ch_123", status: "succeeded" }) };
const result = await processOrder(order, mockPayment);
expect(result.status).toBe("confirmed");
```

Even here, prefer:
- **Sandbox environments** over mocks (Stripe test mode, etc.)
- **Contract tests** that verify mock shape matches real API
- **One mock per test boundary** — don't mock chains of internal calls

## Dependency Injection for Testability

Pass external dependencies in so tests can substitute them:

```typescript
// Testable — dependency is injected
function processOrder(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to test — dependency is created internally
function processOrder(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

This is for **system boundaries** only. Don't inject internal collaborators just to mock them — that's the anti-pattern.
