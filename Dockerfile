# Patch Alpine OS CVEs (openssl, zlib, busybox, etc.) at build time.
FROM node:24-alpine AS base
WORKDIR /app
RUN apk upgrade --no-cache \
  && corepack enable

FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN yarn build

FROM deps AS prod-deps
RUN yarn install --immutable --mode=skip-build

FROM base AS production
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY ecosystem.config.cjs ./
COPY src/mail/templates ./dist/mail/templates
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /root/.npm \
  && chown -R app:app /app
USER app
EXPOSE 3000 3001
CMD ["node", "dist/server.js"]
