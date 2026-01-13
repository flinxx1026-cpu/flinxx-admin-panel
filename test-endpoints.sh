#!/bin/bash

echo "=== Testing Admin Panel Backend Endpoints ==="
echo ""

echo "1. Testing database health..."
curl -s https://flinxx-admin-backend.onrender.com/api/db-health | jq . || echo "Failed"
echo ""

echo "2. Testing users debug endpoint (no auth)..."
curl -s https://flinxx-admin-backend.onrender.com/api/users/debug/test | jq . || echo "Failed"
echo ""

echo "3. Testing health endpoint..."
curl -s https://flinxx-admin-backend.onrender.com/api/health | jq . || echo "Failed"
echo ""

echo "=== Check Render logs in the dashboard for detailed error messages ==="
