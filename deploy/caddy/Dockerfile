# Builds the website's static bundle, then bakes it straight into a Caddy
# image alongside the reverse-proxy config — one image, no separate nginx
# container needed. Build context is the repo root (see docker-compose.yml),
# since this needs both website/ and this directory's Caddyfile.

FROM node:22-alpine AS build
WORKDIR /app
COPY website/package.json website/package-lock.json ./
RUN npm ci
COPY website/ .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv/app
COPY deploy/caddy/Caddyfile /etc/caddy/Caddyfile
