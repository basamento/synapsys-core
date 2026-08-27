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

# Build a static release binary. The frontend is embedded by web/static.go.
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -trimpath -ldflags="-s -w" -o synapsys-core ./cmd/api

# ---- 3. Final runtime image ----
FROM alpine:3.20

WORKDIR /app

# The app opens data/nucleus.db relative to WORKDIR.
RUN addgroup -S synapsys \
    && adduser -S -G synapsys synapsys \
    && mkdir -p /app/data \
    && chown -R synapsys:synapsys /app

COPY --from=backend-builder --chown=synapsys:synapsys \
    /app/synapsys-core /app/synapsys-core

EXPOSE 8080

VOLUME ["/app/data"]

USER synapsys

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/api/health || exit 1

ENTRYPOINT ["/app/synapsys-core"]
