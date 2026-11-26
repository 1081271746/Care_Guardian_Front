FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
# The SSR server bundle is self-contained: only dist/ and public content are needed.
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node content ./content
# Unprivileged user provided by the official Node image.
USER node
EXPOSE 4000
CMD ["node", "dist/careguardian_front/server/server.mjs"]
