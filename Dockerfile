# ---- 1. Build frontend ----
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build


# ---- 2. Build Go backend (embed frontend) ----
FROM golang:1.22-alpine AS backend-builder

WORKDIR /app

# No need for build-base unless you compile C libs, but you may keep it for safety
RUN apk add --no-cache build-base

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .

# Copy built frontend into the correct embed folder
RUN mkdir -p internal/staticfs/static
COPY --from=frontend-builder /frontend/dist/* ./internal/staticfs/static/

# Build backend binary (correct entrypoint)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o synapsys-core ./cmd/core

# ---- 3. Final runtime image ----
FROM alpine:3.20

WORKDIR /app

# copy new binary name
COPY --from=backend-builder /app/synapsys-core /app/synapsys-core

# Copy frontend static files
COPY --from=backend-builder /app/internal/staticfs/static /app/static

# directory for sqlite db
RUN mkdir -p /data
ENV DB_PATH=/data/app.db

EXPOSE 50166

VOLUME ["/data"]

ENTRYPOINT ["/app/synapsys-core"]
