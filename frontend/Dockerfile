# syntax=docker/dockerfile:1
ARG NODE_VERSION=22

# ---- Base ----
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Deps ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- Development: source bind-mounted by compose; Next.js fast refresh ----
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- Build: produce the standalone production bundle ----
FROM deps AS build
COPY . .
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# ---- Production: minimal standalone runtime ----
FROM base AS prod
ENV NODE_ENV=production
# Own the files as `node` so Next.js can write to .next/cache at runtime (ISR, image opt, fetch cache).
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
