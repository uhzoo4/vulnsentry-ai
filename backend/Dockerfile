# ==========================================
# STAGE 1: Build the React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app
ENV PYTHONUNBUFFERED=1

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source code and compile static production build
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Build the FastAPI Backend & Runner
# ==========================================
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

# Install compilation tools for psutil
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY backend/app ./app

# Copy built React frontend files to FastAPI static directory
COPY --from=frontend-builder /app/dist ./app/static

# Ensure logging directory is present inside the container
RUN mkdir -p logs
ENV PORT=7860

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Run uvicorn server
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
