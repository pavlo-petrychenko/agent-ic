# 016 PR media

[Back to the docs](../README.md)

How the screenshots and recordings of a pull request are made, with the seeded demo data and the Playwright MCP.

## What it is

- A pull request that changes UI carries screenshots of every changed screen: EN and UK, light and dark. A flow that moves (drag and connect, autosave, a conflict) also gets a short recording.
- You make them in a browser that you drive against your local stack. The browser is the Playwright MCP, an MCP server that gives Claude Code tools such as `browser_navigate`, `browser_evaluate` and `browser_take_screenshot`.
- The images and videos never enter your branch. They go on the `pr-assets` branch and are linked by raw URL ([014 Shipping](014-shipping.md)).

## Why we have it

- Reviewers see the change without running it, in all four combinations that can break a layout.
- One recipe means the same size, the same data and the same file names in every pull request.
- The seeded demo data means nobody signs up by hand or invents sample content for each screenshot.

## How it works

**1. The data.** `mise run setup` and `mise run db:reset` run `db:seed`. You can run `mise run db:seed` at any time; it changes nothing when the data is already there. It creates:

- one confirmed owner. The email and the password are `SAMPLE_USER_EMAIL` and `SAMPLE_USER_PASSWORD` in [sample-workspace.constants.ts](../../apps/backend/src/modules/identity/constants/sample-workspace.constants.ts);
- one workspace, `Kavarnia Lviv`;
- one live agent, `Support assistant`, with a flow of four steps: a message trigger, a router that looks for the word "human", a greeting and a hand-off to the team ([sample-agent.helpers.ts](../../apps/backend/src/modules/agents/helpers/sample-agent.helpers.ts)).

Sign in at `https://local.agent-ic.pavlop.dev/auth/login` with that owner. A screen that needs other data, such as an empty list, is made in the UI while you shoot, for example in a second workspace.

**2. The browser.** Add the Playwright MCP once, in the local scope, with a config file outside the repository. The viewport is fixed so every image has the same size:

```json
{
  "browser": {
    "browserName": "chromium",
    "isolated": true,
    "launchOptions": { "headless": true },
    "contextOptions": {
      "viewport": { "width": 1440, "height": 900 },
      "ignoreHTTPSErrors": true,
      "recordVideo": { "dir": "<output folder>/videos", "size": { "width": 1440, "height": 900 } }
    }
  },
  "outputDir": "<output folder>"
}
```

```sh
claude mcp add playwright --scope local -- npx -y @playwright/mcp@latest --config <path to the config>
```

`ignoreHTTPSErrors` is there because the local certificate comes from mkcert. Restart the Claude Code session: a server added in a session is loaded by the next one.

**3. The four variants.** The app keeps the language in `localStorage` under `agent-ic.locale` (`en` or `uk`) and the theme under `agent-ic.theme` (`light` or `dark`). For each screen:

1. `browser_navigate` to the route.
2. `browser_evaluate` to set both keys, then `browser_navigate` to the same route again.
3. `browser_take_screenshot` with a file name. Take the screenshot after the data has loaded, not while a skeleton shows.

Name the files `<screen>-<locale>-<theme>.png`, for example `agents-list-uk-dark.png`. Look at every image before you commit it: wrong language, a leftover toast or a skeleton are the usual faults.

**4. A recording.** The browser records the page while it is open. Do the steps slowly, then `browser_close`: the `.webm` file appears in the `videos` folder when the page closes. Keep a recording under about 20 seconds and name it after the flow, for example `drag-and-connect.webm`.

**5. Publish.** Follow "Screenshots for UI changes" in [014 Shipping](014-shipping.md): put the files in a folder named after your work on `pr-assets`, push it, and link each file in the description by its raw URL (`...?raw=true`).

When a stack of pull requests opens before its media exists, write `Screenshots: added in the media pass` under the checklist. The media pass then edits each description.

## In the code

- The seed: [seed.command.ts](../../apps/backend/src/app/commands/seed.command.ts), [sample-workspace.service.ts](../../apps/backend/src/modules/identity/services/sample-workspace.service.ts) and [sample-agent.service.ts](../../apps/backend/src/modules/agents/services/sample-agent.service.ts). The spec is [seed.spec.ts](../../apps/backend/test/integration/seed.spec.ts).
- Where the locale and the theme are stored: `LOCALE_STORAGE_KEY` in `shared/i18n` and `THEME_STORAGE_KEY` in `shared/theme`.
- Decisions: D150 (screenshots), D240 (the seed), D241 (this recipe) in [architecture.md](../design/architecture.md).

## Pitfalls

- **The seed on a used database.** It creates nothing when the demo user, the workspace and an agent exist. If you changed the sample agent and want it back, run `mise run db:reset`.
- **The seed in production.** The command refuses `NODE_ENV=production`. The demo password is public.
- **Mixed variants.** Setting the theme but not reloading shows the old theme. Navigate again after you write the keys.
- **Images in the branch.** `git status` must not list any `.png` or `.webm`. They belong on `pr-assets`.
- **The server is not loaded.** `claude mcp list` shows `playwright`, but its tools appear only in a session started after you added it.

Next: look at real code in the examples, starting with [the identity module](../examples/identity-module.md). The list is in [the examples section](../README.md#examples) of the docs entry page.
