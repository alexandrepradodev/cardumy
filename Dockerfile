# syntax=docker/dockerfile:1

# API image, built in stages: the "kitchen" stages (build) have TypeScript and
# every dev tool; only the "plate" (runtime) is shipped, with the compiled
# JavaScript and the production dependencies.
#
#   base ─┬─ build      all dependencies + tsc -> dist/
#         ├─ prod-deps  production dependencies only
#         └─ runtime    dist/ + prod node_modules, runs as "node"
#
# Debian slim (glibc), not Alpine (musl): the same C library as the CI runners,
# so native modules like @node-rs/argon2 behave the same everywhere.
FROM node:24-slim AS base
# pnpm comes from corepack, pinned by "packageManager" in package.json.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
# Only the files that decide the dependencies. While they don't change,
# Docker reuses the install layers below and skips the download.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod

FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
# The official image ships an unprivileged "node" user: if someone breaks
# into the API, they are not root inside the container.
USER node
EXPOSE 3000
# Slim has no curl, so Node itself asks /health. Docker marks the container
# "unhealthy" when it fails 3 times in a row.
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
# node directly, not "pnpm start": node is PID 1 and receives the SIGTERM
# Docker sends on stop, so the graceful shutdown in main-api.ts runs.
CMD ["node", "dist/main-api.js"]
