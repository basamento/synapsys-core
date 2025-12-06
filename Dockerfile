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

# sqlite3 needs gcc & friends
RUN apk add --no-cache build-base

COPY backend/go.mod backend/go.sum ./
RUN go mod download

# copy backend source
COPY backend/ .

# copy built frontend into backend/static for //go:embed
RUN mkdir -p static
COPY --from=frontend-builder /frontend/dist ./static

# build binary (rename from 'myapp' → 'synapsys-core')
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -o synapsys-core .


# ---- 3. Final runtime image ----
FROM alpine:3.20

WORKDIR /app

# copy new binary name
COPY --from=backend-builder /app/synapsys-core /app/synapsys-core

# Copy frontend static files
COPY --from=backend-builder /app/static /app/static

# directory for sqlite db
RUN mkdir -p /data
ENV DB_PATH=/data/app.db

EXPOSE 8080

VOLUME ["/data"]

ENTRYPOINT ["/app/synapsys-core"]
