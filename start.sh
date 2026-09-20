#!/bin/bash

echo "🚀 Starting SVL Human Resource Management..."
echo ""

# Check if backend is running
if ! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "Starting backend server..."
    cd backend
    npm start &
    BACKEND_PID=$!
    cd ..
    
    echo "⏳ Waiting for backend to start..."
    sleep 3
else
    echo "✅ Backend already running on port 3001"
fi

# Start frontend
echo "Starting frontend server..."
cd frontend
npm start

