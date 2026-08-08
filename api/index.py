import sys
import os

# Add the repository root to sys.path so python can import from backend.app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app

# Expose WSGI/ASGI app for Vercel Serverless
handler = app
