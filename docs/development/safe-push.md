# Safe Push Guide

## Overview

The safe-push feature ensures code quality by running comprehensive checks before pushing to the remote repository. This prevents broken code from being pushed and maintains high code quality standards.

## Usage

### Quick Start

```bash
# Run safe push (recommended)
npm run safe-push

# Or use the script directly
./safe-push.sh

# Alias available
npm run push
```

### What It Checks

1. **Git Status**

   - Ensures working directory is clean
   - Verifies there are commits to push

2. **Code Quality**
   - TypeScript type checking
   - ESLint rules compliance
   - Prettier formatting
   - Unit tests (if present)
   - Build verification

### Example Output

```bash
🚀 TeamSpark AI Safe Push
=========================

📊 Checking git status...
✅ Working directory is clean
✅ 2 commit(s) ready to push

🧪 Running quality checks...

🔍 TypeScript type check...
✅ TypeScript type check passed

🔍 ESLint check...
✅ ESLint check passed

🔍 Prettier format check...
✅ Prettier format check passed

🔍 Unit tests...
✅ Unit tests passed

🔍 Build check...
✅ Build check passed

================================
✅ All checks passed!

🚀 Pushing to origin/feature-branch...
✅ Successfully pushed to origin/feature-branch

📝 Pushed commits:
* abc1234 feat: Add new feature
* def5678 test: Add tests for new feature

💡 Tip: Ready to create a pull request?
   Run: gh pr create
```

### Handling Failures

If any check fails, the script will:

1. Show which checks failed
2. Provide commands to see details
3. Suggest quick fixes
4. Prevent the push

Example failure output:

```bash
❌ TypeScript type check failed
   Run 'npm run type-check' to see details

❌ Some checks failed
Please fix the issues before pushing

Quick fixes:
  - TypeScript errors: npm run type-check
  - ESLint errors: npm run lint -- --fix
  - Format issues: npm run format
  - Test failures: npm test
  - Build errors: Check the build output
```

## Git Hooks

### Pre-Push Hook

A pre-push hook is automatically installed that runs:

- TypeScript type check
- ESLint
- Unit tests

This provides an additional safety net even if you forget to use safe-push.

### Skipping Checks

In emergency situations (not recommended):

```bash
# Skip safe-push and use regular git push
git push

# Skip pre-push hooks
git push --no-verify

# Force push (dangerous!)
git push --force  # safe-push will still run checks
```

## Configuration

The safe-push script uses the following npm scripts:

- `type-check`: TypeScript validation
- `lint`: ESLint checks
- `format:check`: Prettier formatting check
- `test`: Unit test suite
- `build`: Production build

Ensure these scripts are properly configured in your `package.json`.

## Best Practices

1. **Always use safe-push** for feature branches
2. **Fix issues immediately** when checks fail
3. **Don't skip checks** unless absolutely necessary
4. **Keep checks fast** by writing efficient tests
5. **Run checks locally** before committing

## Troubleshooting

### "No commits to push"

You haven't committed your changes or your branch is up to date.

```bash
# Check status
git status
git log --oneline -5

# Commit changes if needed
git add .
git commit -m "feat: Your changes"
```

### "Working directory not clean"

You have uncommitted changes.

```bash
# Option 1: Commit changes
git add .
git commit -m "feat: Your changes"

# Option 2: Stash changes
git stash

# Option 3: Discard changes (careful!)
git checkout .
```

### Checks are too slow

Consider:

- Running tests in parallel
- Optimizing build configuration
- Using `--no-verify` for WIP pushes to personal branches

## Integration with CI/CD

Safe-push complements CI/CD by:

- Catching issues before they reach CI
- Reducing CI build failures
- Saving time and resources
- Improving developer experience

The same checks run in both environments, ensuring consistency.
