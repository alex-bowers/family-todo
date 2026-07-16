FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Install Supabase CLI globally for local development
RUN npm install -g supabase

# Enable corepack and activate the project's pinned pnpm version
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

# Install Playwright system dependencies for Chromium (required for e2e tests)
RUN npx playwright install-deps chromium

# Set working directory
WORKDIR /workspaces/family-todo

# Run as the non-root node user provided by the base image
USER node
