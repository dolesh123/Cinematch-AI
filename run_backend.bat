@echo off
echo Starting CineMatch AI FastAPI Backend Server...
set PYTHONPATH=backend
venv\Scripts\uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
