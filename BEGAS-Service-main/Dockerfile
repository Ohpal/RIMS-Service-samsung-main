# ========================
# BEGAS Dockerfile
# ========================
FROM node:20-alpine AS node-service

# frontend/Dockerfile
FROM node-service AS begas-frontend
WORKDIR /begas-frontend
COPY ./begas-frontend .
RUN npm install
EXPOSE 4800
CMD ["node", "server.js"]


# backend/Dockerfile
FROM python:3.12 AS begas-backend
WORKDIR /begas-backend

RUN apt-get update && apt-get install -y git

COPY ./begas-backend .

ENV PYTHONDONTWRITEBYTECODE=1

RUN pip3 install --upgrade pip
RUN pip3 install --no-cache-dir -r requirements.txt

RUN find /usr/local/lib/python3.12/ -type f -name "*.pyc" -delete && \
    find /usr/local/lib/python3.12/ -type d -name "__pycache__" -exec rm -rf {} +
	
EXPOSE 4850
CMD ["python", "app.py"]