# Stage 1: Build Angular app
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ARG BUILD_CONFIG=production
RUN if [ -n "$BUILD_CONFIG" ]; then npx ng build --configuration $BUILD_CONFIG; else npx ng build; fi

# Stage 2: Serve with Express
FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install --no-save express@4
COPY server.js .
COPY --from=builder /app/dist/crm ./dist
EXPOSE 8080
CMD ["node", "server.js"]
