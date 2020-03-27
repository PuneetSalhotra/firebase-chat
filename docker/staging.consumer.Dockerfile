FROM node:12.10 as base

WORKDIR /app

COPY package*.json /app/
COPY . /app

# Install app dependencies
RUN npm install --only=production

FROM node:12.10.0-slim as release
WORKDIR /app

# Source
COPY --from=base /app .

# HEALTHCHECK --interval=10s --timeout=3s \
#   CMD curl -f -s http://localhost:4001/r0/healthcheck/ || exit 1

ARG BUILD_MODE=staging
ENV mode ${BUILD_MODE}
ENTRYPOINT ["node", "consumer.js"]