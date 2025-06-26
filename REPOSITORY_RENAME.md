# Repository Rename Instructions - TeamSpark AI

This document provides instructions for renaming the repository from `startup-hr` to `team-spark-ai`.

## Git Commands for Repository Rename

### 1. Update Remote URL

If you're using GitHub:

```bash
# Check current remote URL
git remote -v

# Update remote URL (replace USERNAME with your GitHub username)
git remote set-url origin https://github.com/USERNAME/team-spark-ai.git

# Or if using SSH
git remote set-url origin git@github.com:USERNAME/team-spark-ai.git

# Verify the change
git remote -v
```

### 2. Rename Local Directory (Optional)

If you want to rename your local directory:

```bash
# Navigate to parent directory
cd ..

# Rename the directory
mv startup-hr team-spark-ai

# Enter the renamed directory
cd team-spark-ai
```

### 3. Update GitHub Repository

You'll need to rename the repository on GitHub:

1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Under "General", find the "Repository name" field
4. Change from `startup-hr` to `team-spark-ai`
5. Click "Rename"

GitHub will automatically set up redirects from the old repository name to the new one.

### 4. Update Local Configuration

After renaming on GitHub:

```bash
# Fetch the latest changes
git fetch origin

# Set upstream branch
git branch --set-upstream-to=origin/main main
```

### 5. Update Any CI/CD or Deployment Configurations

Make sure to update:

- Any CI/CD pipelines that reference the old repository name
- Deployment scripts
- Environment variables that might contain the old repository URL
- Documentation that references the old repository URL

### 6. Notify Team Members

If working in a team, make sure all team members update their local repositories:

```bash
# Team members should run:
git remote set-url origin https://github.com/USERNAME/team-spark-ai.git
git fetch origin
```

## Verification

To verify everything is working correctly:

```bash
# Check remote URL
git remote -v

# Test by pushing to remote
git push origin main
```

## Notes

- GitHub automatically redirects from the old repository name to the new one
- Existing clones, forks, and links will continue to work
- It's still recommended to update all references to use the new name
- The repository ID remains the same, so issues, PRs, and stars are preserved
