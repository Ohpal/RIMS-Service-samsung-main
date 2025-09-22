# ========================
# RIMS Dockerfile
# ========================
FROM node:20-alpine AS node-service

# frontend/Dockerfile
FROM node-service AS rims-frontend
WORKDIR /rims-frontend
COPY ./rims-frontend .
RUN npm install
EXPOSE 4500
CMD ["node", "server.js"]

# backend/Dockerfile
FROM node-service AS rims-backend
WORKDIR /rims-backend
COPY ./rims-backend .
RUN npm install
EXPOSE 4550
CMD ["npm", "start"]

# rag/Dockerfile
FROM python:3.12 AS rims-backend-rag
WORKDIR /rims-backend-rag

RUN apt-get update && apt-get install -y git

COPY ./rims-backend-rag/ ./

ENV PYTHONDONTWRITEBYTECODE=1

RUN pip3 install --upgrade pip
RUN pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip3 install --no-cache-dir -r requirements.txt

RUN find /usr/local/lib/python3.12/ -type f -name "*.pyc" -delete && \
    find /usr/local/lib/python3.12/ -type d -name "__pycache__" -exec rm -rf {} +
	
EXPOSE 4560
CMD ["python", "rag_api.py"]
#CMD ["uvicorn", "rag_api:app", "--host", "0.0.0.0", "--port", "4560"]