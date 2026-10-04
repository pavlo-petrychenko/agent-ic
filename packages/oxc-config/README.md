# @agent-ic/oxc-config

Shared oxlint rules (`oxlintrc.json`, type-aware rules enabled through `options.typeAware`) and oxfmt options (`oxfmt.json`).

The root `.oxlintrc.json` extends `oxlintrc.json`. oxfmt has no `extends`, so there is no root `.oxfmtrc.json`: the root `format` and `format:check` scripts pass `-c packages/oxc-config/oxfmt.json`.

Must not hold: architecture rules (dependency-cruiser owns those) or per-app overrides.
