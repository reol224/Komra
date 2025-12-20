# Test Suite Documentation

## Overview

This directory contains the test suite for the Komra Security Audit Dashboard. Tests are organized into:

- **E2E Tests** (`tests/e2e/`): End-to-end tests using Playwright
- **Integration Tests** (`tests/integration/`): Component and service integration tests using Vitest
- **Unit Tests** (`src/lib/*.test.ts`): Unit tests for individual services
- **Test Utilities** (`tests/utils/`): Shared test helpers and utilities

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/integration/waitlist.test.tsx

# Run E2E tests (requires Playwright browsers)
# First install browsers: npx playwright install --with-deps
npm run test:e2e

# Or run specific E2E test file
npx playwright test tests/e2e/admin-workflow.spec.ts --project=chromium

# Run tests in watch mode
npm test -- --watch
```

## Test Helpers for Database Operations

### Avoiding Duplicate User Errors

When writing tests that create users, **always use the test helper functions** to avoid duplicate user errors. These helpers automatically clean up existing test data before creating new records.

### Available Helper Functions

Located in `tests/utils/supabase-test-helpers.ts`:

#### `createTestSupabaseClient()`
Creates a Supabase client with service key for test operations.

```typescript
const supabase = createTestSupabaseClient();
```

#### `createTestUser(supabase, data?)`
Creates a test user. **Automatically deletes any existing user with the same email first** to prevent duplicate errors.

```typescript
const user = await createTestUser(supabase, {
  email: 'test-myfeature@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'analyst',
});
```

#### `deleteTestUser(supabase, email)`
Deletes a test user by email. Does not throw an error if the user doesn't exist.

```typescript
await deleteTestUser(supabase, 'test-myfeature@example.com');
```

#### `cleanupTestData(supabase)`
Cleans up all test data:
- Users with emails matching `test-%@example.com`
- Endpoints with hostnames matching `test-%`
- Vulnerabilities with CVE IDs matching `TEST-%`

```typescript
await cleanupTestData(supabase);
```

#### `createTestEndpoint(supabase, data?)`
Creates a test endpoint with a unique hostname.

```typescript
const endpoint = await createTestEndpoint(supabase, {
  os_type: 'Linux',
  environment: 'production',
});
```

#### `createTestVulnerability(supabase, endpointId, data?)`
Creates a test vulnerability for an endpoint.

```typescript
const vuln = await createTestVulnerability(supabase, endpoint.id, {
  severity: 'critical',
  cvss_score: 9.8,
});
```

### Recommended Test Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  createTestSupabaseClient, 
  createTestUser, 
  deleteTestUser, 
  cleanupTestData 
} from '../utils/supabase-test-helpers';

describe('My Feature Tests', () => {
  const supabase = createTestSupabaseClient();
  const testEmail = 'test-myfeature@example.com';

  beforeEach(async () => {
    // Clean up before each test to ensure clean state
    await cleanupTestData(supabase);
  });

  afterEach(async () => {
    // Clean up after each test to avoid leaving test data
    await deleteTestUser(supabase, testEmail);
    await cleanupTestData(supabase);
  });

  it('should create a user', async () => {
    // This automatically deletes any existing user with this email first
    const user = await createTestUser(supabase, {
      email: testEmail,
      first_name: 'John',
      last_name: 'Doe',
    });

    expect(user.email).toBe(testEmail);
    expect(user.first_name).toBe('John');
  });

  it('should handle duplicate user creation', async () => {
    // First creation
    await createTestUser(supabase, { email: testEmail });

    // Second creation with same email - no error!
    const user = await createTestUser(supabase, { 
      email: testEmail,
      first_name: 'Jane',
    });

    expect(user.first_name).toBe('Jane');
  });
});
```

### Best Practices

1. **Use unique test emails**: Always use emails like `test-feature-name@example.com` to avoid conflicts
2. **Clean up in hooks**: Use `beforeEach` and `afterEach` to ensure tests start clean and don't leave data
3. **Use createTestUser()**: Never insert users directly - always use the helper to avoid duplicates
4. **Never use production emails**: All test emails should match the pattern `test-%@example.com`
5. **Test isolation**: Each test should be independent and not rely on data from other tests

### Why This Matters

Without proper cleanup, tests can fail with duplicate key errors:
```
Error: duplicate key value violates unique constraint "users_email_key"
```

The test helpers prevent this by:
- Deleting existing test data before creating new records
- Using unique identifiers (timestamps, UUIDs)
- Providing cleanup functions for `beforeEach`/`afterEach` hooks

## Test Coverage

Current test coverage:
- **55 tests** across 6 test files
- Integration tests for authentication, dashboard, waitlist
- Unit tests for email service and Stripe webhooks
- E2E tests for critical user flows

## Adding New Tests

1. Create test file in appropriate directory
2. Import test helpers from `tests/utils/supabase-test-helpers`
3. Use `beforeEach`/`afterEach` for cleanup
4. Follow the recommended test pattern above
5. Run tests to verify they pass
6. Commit with conventional commit message (e.g., `test: add user management tests`)
