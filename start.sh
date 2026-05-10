#!/bin/bash
set -e

echo "Starting Stupid Radar Chart App..."

# Start backend server in background
echo "Starting backend server on port 8000..."
cd /root/projects/stupid-radar-app/backend
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Start frontend server in background
echo "Starting frontend server on port 8080..."
cd /root/projects/stupid-radar-app/frontend
nohup python3 -m http.server 8080 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "=============================================="
echo "App is running!"
echo "=============================================="
echo "Frontend: http://localhost:8080"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "=============================================="
echo "Logs:"
echo "  Backend: /tmp/backend.log"
echo "  Frontend: /tmp/frontend.log"
echo "=============================================="
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for servers
wait
