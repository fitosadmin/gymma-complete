# Vercel Deployment Rules
- NEVER bypass GitHub to manually deploy to Vercel via the terminal CLI (`npx vercel --prod`).
- ALWAYS commit and push all code changes to the GitHub repository first, so Vercel's automatic CI/CD can trigger the deployment. This ensures the codebase remains the single source of truth and commits are visible to the user.
