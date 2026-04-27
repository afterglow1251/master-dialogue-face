FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_WS_URL
ARG VITE_CLERK_PUBLISHABLE_KEY

COPY frontend/package.json frontend/bun.lock* ./
RUN bun install --frozen-lockfile

COPY frontend/ .
COPY shared/ /shared
RUN bun run build-only

FROM nginx:1.27-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
