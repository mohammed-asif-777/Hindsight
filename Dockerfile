FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Build vector database if data exists
RUN python scripts/build_vectordb.py || echo "Vector DB build skipped"

# Expose ports
EXPOSE 7860 8000

# Launch Gradio app (includes backend)
CMD ["python", "app.py"]
