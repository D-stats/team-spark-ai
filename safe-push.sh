#!/bin/bash

# TeamSpark AI Safe Push Script
# Ensures all quality checks pass before pushing to remote

echo "🚀 TeamSpark AI Safe Push"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any check fails
CHECKS_PASSED=true

# Function to run a check
run_check() {
    local description=$1
    local command=$2
    
    echo -e "\n🔍 ${description}..."
    if eval $command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${description} passed${NC}"
    else
        echo -e "${RED}❌ ${description} failed${NC}"
        echo -e "${YELLOW}   Run '${command}' to see details${NC}"
        CHECKS_PASSED=false
    fi
}

# 1. Check if there are any changes to push
echo -e "\n📊 Checking git status..."
if [[ -z $(git status --porcelain) ]]; then
    echo -e "${GREEN}✅ Working directory is clean${NC}"
else
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    echo "   Please commit or stash your changes before pushing"
    exit 1
fi

# 2. Check if we're ahead of remote
BRANCH=$(git rev-parse --abbrev-ref HEAD)
AHEAD=$(git rev-list --count origin/$BRANCH..$BRANCH 2>/dev/null || echo "0")

if [[ "$AHEAD" == "0" ]]; then
    echo -e "${YELLOW}⚠️  No commits to push${NC}"
    exit 0
else
    echo -e "${GREEN}✅ $AHEAD commit(s) ready to push${NC}"
fi

# 3. Run quality checks
echo -e "\n🧪 Running quality checks..."

# TypeScript check
run_check "TypeScript type check" "npm run type-check"

# ESLint check
run_check "ESLint check" "npm run lint"

# Prettier check
run_check "Prettier format check" "npm run format:check"

# Tests (if they exist)
if [[ -f "src/app/layout.test.tsx" ]] || [[ -d "tests" ]]; then
    run_check "Unit tests" "npm test -- --passWithNoTests"
fi

# Build check
run_check "Build check" "npm run build"

# 4. Check results
echo -e "\n================================"
if [[ "$CHECKS_PASSED" == true ]]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo -e "\n🚀 Pushing to origin/$BRANCH..."
    
    # Push to remote
    if git push origin $BRANCH; then
        echo -e "${GREEN}✅ Successfully pushed to origin/$BRANCH${NC}"
        
        # Show the pushed commits
        echo -e "\n📝 Pushed commits:"
        git log --oneline --graph -n $AHEAD
        
        # Check if this is a feature branch
        if [[ "$BRANCH" != "main" ]] && [[ "$BRANCH" != "master" ]]; then
            echo -e "\n${YELLOW}💡 Tip: Ready to create a pull request?${NC}"
            echo "   Run: gh pr create"
        fi
    else
        echo -e "${RED}❌ Push failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Some checks failed${NC}"
    echo -e "${YELLOW}Please fix the issues before pushing${NC}"
    echo -e "\nQuick fixes:"
    echo "  - TypeScript errors: npm run type-check"
    echo "  - ESLint errors: npm run lint -- --fix"
    echo "  - Format issues: npm run format"
    echo "  - Test failures: npm test"
    echo "  - Build errors: Check the build output"
    exit 1
fi