# Synapsys Core

Synapsys is a self-hosted control plane for background work that already runs in
your applications and scripts. Core provides the Cortex operator console and an
API to view registered processes, start or stop work, inspect execution history,
and read output. The work stays in its application: a worker connects to Core
using an SDK or the HTTP API.

## Explore the ecosystem

| Component | Repository |
| --- | --- |
| Documentation | [synapsys-docs](https://github.com/basamento/synapsys-docs) |
| Spring Boot starter | [synapsys-spring-boot-starter](https://github.com/basamento/synapsys-spring-boot-starter) |
| Node.js SDK | [synapsys-node-sdk](https://github.com/basamento/synapsys-node-sdk) |
| Python SDK | [synapsys-python-sdk](https://github.com/basamento/synapsys-python-sdk) |
| Go SDK | [synapsys-go-sdk](https://github.com/basamento/synapsys-go-sdk) |
| .NET SDK | [synapsys-dotnet-sdk](https://github.com/basamento/synapsys-dotnet-sdk) (NuGet packages are not yet published) |

The repositories have separate licenses: Core uses Elastic License 2.0, while
the SDKs, starter, and documentation use Apache License 2.0.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution process and the
current status of the contributor license agreement.

## Run locally with Docker

With Docker installed, build the image from the repository root:

```bash
docker build -t synapsys-core:local .
```

Start Core and choose a password for the initial operator account:

```bash
docker run -d \
  --name synapsys-core \
  -p 8080:8080 \
  -e SYNAPSYS_AUTH_USERNAME=admin \
  -e SYNAPSYS_AUTH_PASSWORD='choose-a-strong-password' \
  -v synapsys_data:/app/data \
  synapsys-core:local
```

Open <http://localhost:8080> and sign in with the credentials supplied above.
In **Settings**, create a worker token to connect an application using one of
the Synapsys SDKs. Replace the example password with your own value.

The frontend is compiled and embedded into the Go executable. Runtime state,
including the operator account, is stored in the `synapsys_data` volume.

## Container authentication

`SYNAPSYS_AUTH_PASSWORD_FILE` can be used instead of
`SYNAPSYS_AUTH_PASSWORD` when supplying a Docker secret. The credentials are
only used to initialize an empty data volume; changing the environment
variables later does not overwrite the persisted password.

For local development only, authentication can be explicitly disabled by
passing this environment variable to the container:

```bash
-e SYNAPSYS_AUTH_DISABLED=true
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

## Docker Compose reference

A reference Compose configuration is available in [deploy/compose.yml](deploy/compose.yml).
It expects an external Docker network named `proxy` and an external volume named
`synapsys_data`. Set the values from [deploy/.env.example](deploy/.env.example)
in a `.env` file before starting the service. Review the example configuration
and adapt it to your own environment.

## Copyright and licence

Copyright 2026 Julian Marzoli (Basamento).

Synapsys Core is source-available under the [Elastic License 2.0](LICENSE).
The license permits use, modification, and redistribution subject to its terms,
including restrictions on providing substantial functionality as a hosted or
managed service. Contact the copyright holder about a separate license for uses
not permitted by these terms. Third-party components retain their own licenses.
The container includes collected third-party license files and dependency
metadata in `/app/third-party-licenses`; entries without a license file in the
upstream package require separate review.
