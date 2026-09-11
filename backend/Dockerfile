# Railway Deployment

FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev for Prisma)
RUN npm install --include=dev

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npx nest build

# Bake SQLite DB (for fallback if no Postgres)
RUN node scripts/bake-db.js || echo "Bake DB skipped"

# Expose port
EXPOSE 3001

# Start production server
CMD ["node", "dist/src/main.js"]
