# Contributing to Synapsys Core

Thank you for your interest in Synapsys Core. Bug reports, ideas, documentation,
and code contributions are welcome. For significant changes, please open an
issue first so that the approach can be discussed before you invest time in it.

## Pull requests

1. Fork the repository and create a branch for your change.
2. Make the change and run the relevant checks below.
3. Open a pull request describing the problem, your change, and how you tested it.
4. Accept the [Contributor License Agreement](CLA.md) as described below.
5. Respond to review feedback and update the pull request as needed.

Core is source-available under the [Elastic License 2.0](LICENSE). The project
requires a contributor license agreement (CLA) before merging external
contributions. The CLA allows the maintainer to offer Core under separate
commercial terms, while contributors retain ownership of their work.

CLA automation has not yet been configured. Until it is available, each
contributor must read [CLA version 1.0](CLA.md) and post the following comment on
their pull request: `I have read and agree to the Synapsys Core Contributor License Agreement, version 1.0, including my contributions in this pull request.`
Every contributor whose work is included must accept. The maintainer must verify
and preserve the acceptance before merging. This acceptance also applies to
Contributions submitted afterward; identify any other earlier submissions it
should cover.
If your employer or another party has rights to your contribution, the rights
holder's authorization or separate acceptance may be needed before merging.

Please do not submit code, assets, or other material that you cannot contribute
under the project's terms. Identify any third-party material in your pull request.
Never include secrets or private data in an issue or pull request.

## Checks

For backend changes, from `backend/`:

```sh
go test ./...
```

For frontend changes, from `frontend/`:

```sh
npm ci
npm run lint
npm run build
```

Other Synapsys repositories have their own licenses and contribution terms.
