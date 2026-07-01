# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# Production stage
FROM node:20-alpine
WORKDIR /app
# Pour la sécurité, on utilise un utilisateur non root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build --chown=appuser:appgroup /app /app
USER appuser
EXPOSE 3000
CMD ["node", "src/app.js"]
