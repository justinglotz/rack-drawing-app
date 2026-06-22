# syntax=docker/dockerfile:1
ARG NODE_VERSION=22

# ---- Base: system deps Prisma needs (openssl) ----
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- Deps: install all deps (incl. dev) for prisma generate + tsc ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- Generate Prisma client (shared by dev and build) ----
FROM deps AS prisma
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://placeholder" npx prisma generate

# ---- Development: source is bind-mounted by compose; hot reload via nodemon/tsx ----
FROM prisma AS dev
ENV NODE_ENV=development
EXPOSE 8000
CMD ["npm", "run", "dev"]

# ---- Build: compile TypeScript (incl. the generated Prisma client) to dist/ ----
FROM prisma AS build
COPY . .
RUN npm run build

# ---- Production: compiled JS on plain node, prod deps only ----
FROM base AS prod
ENV NODE_ENV=production
COPY package.json package-lock.json ./
# Prod runtime deps, plus the Prisma CLI for running migrations as a release step.
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev && npm i --no-save prisma
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8000
# Run `npx prisma migrate deploy` as a release step on your platform before this starts.
CMD ["node", "dist/src/index.js"]
