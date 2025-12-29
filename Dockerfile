FROM node:20-alpine AS base

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 安装构建依赖（用于 better-sqlite3 和 sharp）
RUN apk add --no-cache python3 make g++ 

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# 复制构建产物
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/public ./public

# 创建数据目录（uploads 放在 data 目录下，与数据库一起管理）
RUN mkdir -p /app/data/uploads/originals /app/data/uploads/thumbs
RUN chown -R nuxtjs:nodejs /app/data

USER nuxtjs

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", ".output/server/index.mjs"]
