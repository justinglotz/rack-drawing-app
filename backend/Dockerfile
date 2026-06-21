# syntax=docker/dockerfile:1
ARG NODE_VERSION=22

# ---- Base: system deps Prisma needs (openssl) ----
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- Deps: install all deps (incl. dev) for prisma generate + tsx ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- Generate Prisma client ----
FROM deps AS prisma
COPY prisma ./prisma
RUN npx prisma generate

# ---- Development: source is bind-mounted by compose; hot reload via nodemon/tsx ----
FROM prisma AS dev
ENV NODE_ENV=development
EXPOSE 8000
CMD ["npm", "run", "dev"]

# ---- Production: prod deps + tsx/prisma CLI only ----
FROM base AS prod
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && npm i --no-save tsx prisma
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
USER node
EXPOSE 8000
# Run migrations as a release step on your platform; this just starts the server.
CMD ["npx", "tsx", "src/index.ts"]
