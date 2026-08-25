# ---- 1. Build frontend ----
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build


# ---- 2. Build Go backend (embed frontend) ----
FROM golang:1.25-alpine AS backend-builder

ARG TARGETOS=linux
ARG TARGETARCH=amd64

WORKDIR /app

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .

# Copy built frontend into the correct embed folder
RUN mkdir -p web/dist
COPY --from=frontend-builder /frontend/dist/ ./web/dist/

# Build backend binary (correct entrypoint)
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -o synapsys-core ./cmd/api

# ---- 3. Final runtime image ----
FROM alpine:3.20

WORKDIR /app

# copy new binary name
COPY --from=backend-builder /app/synapsys-core /app/synapsys-core

# The app opens data/nucleus.db relative to WORKDIR.
RUN mkdir -p /app/data

EXPOSE 8080

VOLUME ["/app/data"]

ENTRYPOINT ["/app/synapsys-core"]
