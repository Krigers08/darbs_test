FROM php:8.5-alpine

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Expose port
EXPOSE 8000

# Build command - run import
RUN psql $DATABASE_PUBLIC_URL < import.sql || true

# Start PHP server
CMD php -S 0.0.0.0:8000
