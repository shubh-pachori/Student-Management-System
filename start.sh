#!/bin/bash

# Function to kill all background processes on exit
cleanup() {
    echo -e "\nStopping Student Management System..."
    kill $(jobs -p)
    exit
}
trap cleanup EXIT

echo "Starting Identity Service on http://localhost:5003..."
cd backend/IdentityService
dotnet run --urls "http://localhost:5003" &

echo "Starting Academic Service on http://localhost:5002..."
cd ../AcademicService
dotnet run --urls "http://localhost:5002" &

echo "Starting React Frontend on http://localhost:5173..."
cd ../../frontend
npm run dev &

echo "=================================================="
echo "Student Management System is starting!"
echo "- Frontend: http://localhost:5173"
echo "- Identity Service: http://localhost:5003"
echo "- Academic Service: http://localhost:5002"
echo "=================================================="
echo "Press Ctrl+C to terminate all services."

wait
