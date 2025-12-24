# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN pnpm prisma:generate

# Build the application
RUN pnpm build

# ============================================
# Stage 3: Production
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy node_modules from builder (includes generated Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema and migrations (needed for migrations)
COPY prisma ./prisma

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port (NestJS default is 3000)
EXPOSE 3000

# Run migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
