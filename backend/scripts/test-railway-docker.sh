#!/bin/bash
# Test Railway deployment locally

set -e

echo "🐳 Building Docker image for Railway deployment..."
cd /workspace/backend

# Build
docker build -t tennis-manager-api:test .

echo ""
echo "✅ Build successful!"
echo ""
echo "🚀 Starting container..."
docker run -d --name tennis-api-test -p 3001:3001 tennis-manager-api:test

echo ""
echo "⏳ Waiting for API to start (10s)..."
sleep 10

echo ""
echo "🧪 Testing API..."
curl -s http://localhost:3001/api || echo "API not responding"

echo ""
echo "📋 Container logs:"
docker logs tennis-api-test

echo ""
echo "🧹 Cleanup..."
docker stop tennis-api-test
docker rm tennis-api-test

echo ""
echo "✅ Railway deployment test complete!"
