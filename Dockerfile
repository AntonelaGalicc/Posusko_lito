# Use official Python base image
FROM python:3.13-slim

# Set work directory
WORKDIR /app

# Install build dependencies (ako koristiš gunicorn ili druge wheel pakete)
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose Flask port
EXPOSE 5000

# Define environment variables
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Start app (use this if you're in dev mode)
CMD ["flask", "run"]
