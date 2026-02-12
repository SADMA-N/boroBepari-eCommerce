#!/bin/bash

# Seed All Script
# Created by Gemini CLI

set -e # Exit immediately if a command exits with a non-zero status

log() {
    echo -e "\033[1;32m[SEED] $1\033[0m"
}

error() {
    echo -e "\033[1;31m[ERROR] $1\033[0m"
    exit 1
}

log "Starting database seeding process..."

# 1. Run Migrations
log "Running database migrations..."
set +e
if npm run db:migrate; then
    log "Migrations completed successfully."
else
    echo -e "\033[1;33m[WARNING] Migrations failed. Assuming database is already set up. Continuing...\033[0m"
fi
set -e

# 2. Seed Categories
log "Seeding categories..."
if bun scripts/seed-categories.ts; then
    log "Categories seeded successfully."
else
    error "Failed to seed categories."
fi

# 3. Seed Sellers (and Suppliers)
log "Seeding sellers and suppliers..."
if bun scripts/seed-sellers.ts; then
    log "Sellers seeded successfully."
else
    error "Failed to seed sellers."
fi

# 4. Download Product Images
log "Downloading product images..."
if [ -f "download-images.sh" ]; then
    chmod +x download-images.sh
    if ./download-images.sh; then
        log "Images downloaded successfully."
    else
        error "Failed to download images."
    fi
else
    error "download-images.sh not found. Please generate it first."
fi

# 5. Upload Images to S3 (Local/Remote)
log "Uploading images to storage..."
if bun scripts/upload-images-to-s3.ts; then
    log "Images uploaded successfully."
else
    error "Failed to upload images."
fi

# 6. Seed Products
log "Seeding products..."
if bun scripts/seed-products.ts; then
    log "Products seeded successfully."
else
    error "Failed to seed products."
fi

log "🎉 All seeding tasks completed successfully!"
