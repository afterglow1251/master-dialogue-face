FROM oven/bun:1.2-alpine

WORKDIR /app

COPY backend/package.json backend/bun.lock* ./
RUN bun install --frozen-lockfile

COPY backend/ .
COPY shared/ /shared

EXPOSE 3000

CMD ["sh", "-c", "bun run db:migrate && bun run db:seed && bun run src/index.ts"]
