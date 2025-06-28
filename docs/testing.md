# Testing Guide

This document outlines the testing strategy and guidelines for TeamSpark AI.

## Testing Stack

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: Jest built-in coverage reporter

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:ui

# Run story-based E2E tests
npm run test:stories
```

## Writing Unit Tests

### Component Tests

Place component tests next to the components in `__tests__` directories:

```typescript
// src/components/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
})
```

### Utility Function Tests

```typescript
// src/lib/__tests__/utils.test.ts
import { formatDate } from '@/lib/utils';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-06-19');
    expect(formatDate(date)).toBe('2025年6月19日');
  });
});
```

### Service Tests

```typescript
// src/services/__tests__/user.test.ts
import { getUserById } from '@/services/user';
import { prismaMock } from '@/tests/utils/prisma-mock';

describe('User Service', () => {
  it('fetches user by id', async () => {
    const mockUser = { id: '1', name: 'Test User' };
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const user = await getUserById('1');
    expect(user).toEqual(mockUser);
  });
});
```

## Testing Best Practices

### 1. Test Structure

Follow the AAA pattern:

- **Arrange**: Set up test data and conditions
- **Act**: Execute the function/component
- **Assert**: Verify the results

### 2. Test Naming

Use descriptive test names that explain what is being tested:

```typescript
// Good
it('displays error message when form submission fails');

// Bad
it('test error');
```

### 3. Component Testing

- Test user interactions, not implementation details
- Use `screen` queries from React Testing Library
- Prefer `getByRole` over `getByTestId`
- Test accessibility features

### 4. Mocking

- Mock external dependencies (API calls, database)
- Use `jest.mock()` for module mocking
- Create reusable mock utilities

### 5. Coverage Goals

- Aim for 80%+ coverage for critical paths
- Focus on behavior coverage, not line coverage
- Test edge cases and error scenarios

## Test Organization

```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── __tests__/
│   │       └── button.test.tsx
│   └── features/
│       ├── kudos/
│       │   ├── kudos-card.tsx
│       │   └── __tests__/
│       │       └── kudos-card.test.tsx
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts
└── services/
    ├── user.ts
    └── __tests__/
        └── user.test.ts
```

## Continuous Integration

Tests run automatically on:

- Every push to main/develop branches
- Every pull request
- Can be run manually via GitHub Actions

Coverage reports are uploaded as artifacts for each test run.

## Debugging Tests

### Jest Debugging

```bash
# Run a specific test file
npm test -- button.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="renders with text"

# Debug in VS Code
# Add breakpoint and run "Jest: Debug" from Command Palette
```

### Common Issues

1. **Module resolution errors**: Check `jest.config.js` moduleNameMapper
2. **TypeScript errors**: Ensure `ts-jest` is configured correctly
3. **Next.js specific errors**: Mock Next.js modules in `jest.setup.js`

## Future Improvements

- [ ] Add visual regression testing
- [ ] Implement mutation testing
- [ ] Add performance testing
- [ ] Create more test utilities and helpers
