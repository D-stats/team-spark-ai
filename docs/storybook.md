# Storybook Documentation

## Overview

TeamSpark AI uses Storybook for component development and documentation. Storybook provides an isolated environment to build and test UI components.

## Getting Started

### Running Storybook

```bash
# Start Storybook development server
npm run storybook

# Build static Storybook
npm run build-storybook
```

Storybook will be available at `http://localhost:6006`

## Directory Structure

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── button.stories.tsx    # Component story
│       └── button.test.tsx       # Component test
└── stories/
    └── KudosCard.stories.tsx     # Feature story
```

## Writing Stories

### Basic Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};
```

### Story Categories

Stories are organized by category:

- **UI/** - Basic UI components (buttons, cards, badges)
- **Features/** - Complex feature components (KudosCard, TeamList)
- **Forms/** - Form components and inputs
- **Layout/** - Layout components (headers, sidebars)
- **Pages/** - Full page examples

### Story Best Practices

1. **One story per variant** - Create separate stories for each variant
2. **Use realistic data** - Use data that resembles production
3. **Show all states** - Include loading, error, and empty states
4. **Add controls** - Use argTypes for interactive props
5. **Document with comments** - Add JSDoc comments for components

## Component Development Workflow

### 1. Create Component

```typescript
// src/components/ui/alert.tsx
export function Alert({ title, description, variant = 'default' }) {
  return (
    <div className={cn('alert', variant)}>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  )
}
```

### 2. Create Story

```typescript
// src/components/ui/alert.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './alert';

const meta = {
  title: 'UI/Alert',
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Alert Title',
    description: 'This is an alert description',
  },
};
```

### 3. Test in Storybook

- View component in isolation
- Test different props using controls
- Check responsive behavior
- Verify accessibility

### 4. Write Tests

```typescript
// src/components/ui/alert.test.tsx
import { render, screen } from '@testing-library/react'
import { Alert } from './alert'

test('renders alert with title', () => {
  render(<Alert title="Test Alert" description="Test description" />)
  expect(screen.getByText('Test Alert')).toBeInTheDocument()
})
```

## Storybook Features

### Controls

Interactive controls for component props:

```typescript
argTypes: {
  size: {
    control: 'select',
    options: ['sm', 'md', 'lg'],
  },
  disabled: {
    control: 'boolean',
  },
  count: {
    control: { type: 'range', min: 0, max: 100 },
  },
}
```

### Actions

Log component interactions:

```typescript
import { action } from '@storybook/addon-actions';

export const Clickable: Story = {
  args: {
    onClick: action('clicked'),
  },
};
```

### Decorators

Wrap stories with additional context:

```typescript
const meta = {
  decorators: [
    (Story) => (
      <div className="p-8 bg-gray-100">
        <Story />
      </div>
    ),
  ],
}
```

### Parameters

Configure story behavior:

```typescript
parameters: {
  layout: 'centered', // centered, fullscreen, padded
  backgrounds: {
    default: 'dark',
  },
  viewport: {
    defaultViewport: 'mobile1',
  },
}
```

## Advanced Usage

### Composite Stories

```typescript
export const KudosFeed: Story = {
  render: () => (
    <div className="space-y-4">
      {kudosList.map((kudos) => (
        <KudosCard key={kudos.id} kudos={kudos} />
      ))}
    </div>
  ),
}
```

### Mock Data

```typescript
import { faker } from '@faker-js/faker';

const mockUser = {
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  avatar: faker.image.avatar(),
};
```

### Internationalization

```typescript
export const Japanese: Story = {
  parameters: {
    locale: 'ja',
  },
  args: {
    children: 'ボタン',
  },
};
```

### Dark Mode

```typescript
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
}
```

## Build & Deploy

### Build Static Storybook

```bash
# Build Storybook
npm run build-storybook

# Output in storybook-static/
```

### Deploy Options

1. **Vercel/Netlify** - Deploy storybook-static directory
2. **GitHub Pages** - Use GitHub Actions to deploy
3. **Chromatic** - Visual testing and deployment
4. **Docker** - Containerize Storybook

### CI Integration

```yaml
# .github/workflows/storybook.yml
name: Storybook
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build-storybook
      - uses: actions/upload-artifact@v3
        with:
          name: storybook-static
          path: storybook-static
```

## Best Practices

### Component Organization

1. **Colocate stories** - Keep stories next to components
2. **Use TypeScript** - Type-safe stories with auto-completion
3. **Document props** - Use JSDoc for prop documentation
4. **Show edge cases** - Include error and edge case stories

### Performance

1. **Lazy load** - Use dynamic imports for heavy components
2. **Optimize assets** - Use optimized images and icons
3. **Code splitting** - Split stories by feature

### Accessibility

1. **Test with keyboard** - Ensure keyboard navigation works
2. **Check contrast** - Use accessibility addon
3. **Add ARIA labels** - Include proper accessibility attributes
4. **Test screen readers** - Verify screen reader compatibility

## Troubleshooting

### Common Issues

1. **Styles not loading**

   - Import global CSS in `.storybook/preview.ts`
   - Check PostCSS configuration

2. **Next.js features not working**

   - Use `@storybook/nextjs` framework
   - Configure Next.js features in main.ts

3. **TypeScript errors**

   - Update `tsconfig.json` to include stories
   - Install type definitions

4. **Slow build times**
   - Exclude node_modules in stories glob
   - Use production builds

### Debug Mode

```bash
# Run Storybook with debug logging
DEBUG=storybook:* npm run storybook
```

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Storybook Tutorials](https://storybook.js.org/tutorials)
- [Component Driven Development](https://componentdriven.org)
- [Storybook Addons](https://storybook.js.org/addons)
