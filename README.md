# Synapsys Core

Synapsys Core serves the Cortex operator console and its control-plane API on
port `8080`.

## Docker image

The production image is published privately to GitHub Container Registry:

```text
ghcr.io/basamento/synapsys-core
```

Images are published by the `Publish Docker image` workflow when a version tag
starting with `v` is pushed. This project is still pre-1.0, so use versions such
as `v0.1.0`, `v0.1.0-alpha.1`, or `v0.0.5`. Stable version tags also update the
mutable `latest` tag.

To publish a release after committing the desired changes:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The GitHub Container Registry package should remain private. Its visibility is
managed separately from the GitHub repository, so verify the package settings
after the first publish.

The frontend is compiled and embedded into the Go executable. The final image
does not contain the Node.js toolchain, Go toolchain, application source, or
frontend source. Runtime state is stored in the `/app/data` volume.

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
  ghcr.io/basamento/synapsys-core:0.1.0
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

