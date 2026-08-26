# Synapsys Core

Synapsys Core serves the Cortex operator console and its control-plane API on
port `8080`.

## Container authentication

The first enabled startup creates one operator account in the persistent
`/app/data` database:

```bash
docker run -d \
  --name synapsys-core \
  -p 8080:8080 \
  -e SYNAPSYS_AUTH_USERNAME=admin \
  -e SYNAPSYS_AUTH_PASSWORD='change-me' \
  -v synapsys_data:/app/data \
  synapsys-core:latest
```

`SYNAPSYS_AUTH_PASSWORD_FILE` can be used instead of
`SYNAPSYS_AUTH_PASSWORD` when supplying a Docker secret. The credentials are
only used to initialize an empty data volume; changing the environment
variables later does not overwrite the persisted password.

For local development only, authentication can be explicitly disabled:

```powershell
$env:SYNAPSYS_AUTH_DISABLED = "true"
dev\run-core.ps1
```

The UI uses an HttpOnly cookie session. Put the container behind HTTPS before
exposing it beyond a trusted local network, and set
`SYNAPSYS_AUTH_COOKIE_SECURE=true` when HTTPS is in use.

## Worker authentication

Every worker heartbeat must include a worker credential. To configure a
deployment-wide credential without using the UI, set:

```bash
-e SYNAPSYS_WORKER_TOKEN='use-a-different-secret'
```

Workers must then send `Authorization: Bearer <token>`. This credential is
intentionally separate from the browser operator password.

Alternatively, sign in to the UI, open **Settings**, and generate a worker
token. The raw token is shown only once. Core stores only a hash, and tokens
can be revoked from the same page. Worker requests authenticate with either
an active generated token or `SYNAPSYS_WORKER_TOKEN`.
