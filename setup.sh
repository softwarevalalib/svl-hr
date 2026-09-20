#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║      SVL Human Resource Management Setup Script              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"
echo ""

# Setup backend
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo "✅ Backend dependencies installed"
echo ""

# Initialize database
echo "🗄️  Initializing database..."
npm run init-db
if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi
echo "✅ Database initialized"
echo ""

cd ..

# Setup frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
echo "✅ Frontend dependencies installed"
echo ""

cd ..

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete!                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 To start the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && npm start"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend && npm start"
echo ""
echo "  Then open: http://localhost:3000"
echo ""
echo "  Login: admin / admin123"
echo ""

