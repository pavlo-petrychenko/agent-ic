# Chat-agent builder — product vision and MVP scope

**Status:** vision from the product concept; MVP scope agreed Oct 2026; updated 2026-10-04 to match `architecture.md` (models D81–D84, D90; traces D47–D48)

This document has two parts:
- **Part 1 — Product vision** describes the whole product we want to build, independent of what ships first.
- **Part 2 — MVP** says which parts of that vision we build now, and specifies them in detail.

**Design:**
- The **Screens** page holds the full-vision designs.
- The **MVP flows** page holds 5 use-case maps; the **MVP screens** page holds 82 MVP screens.
- MVP screen references use the board file names without the `MVP-` prefix and `.dc.html` suffix (e.g. `Inbox-Waiting` = `MVP-Inbox-Waiting.dc.html`). Full-vision screens are marked *(vision)*.

---

# Part 1 — Product vision

## 1. The idea

An **API-first platform** where a small business does four things:
- builds an AI chat agent **visually**;
- gives it knowledge from its **own documents**;
- extends it with **custom tools**;
- publishes it to **messengers** in a few clicks.

The same platform also works as a **headless backend**. Developers build their own products on top of it, and our frontend is just one client of the public API.

**Example used across the design:** "Demo salon", a beauty salon. Its assistant:
- answers questions about services, prices and opening hours;
- books appointments through the salon's systems;
- hands complaints to the manager;
- follows up with clients who went quiet.

## 2. Audiences

- **Business owners:** want a working bot from a template, with no code.
- **Agencies and freelancers:** build and maintain agents for many clients.
- **Developers:** write custom tools, add channel adapters, and drive the platform through the API.

## 3. Principles

- **API-first.** Everything the UI does is available through the public API; the UI has no private endpoints.
- **Graph over roles.** There are no fixed "judge", "scorer" or "follow-up" features. They are ordinary nodes the user wires into a flow, e.g. a judge is a Completion node running in parallel.
- **Extensible by design.** Tools, channel adapters and knowledge connectors all use public interfaces that the platform itself uses internally.
- **Ukraine first.** Ukrainian and English UI from day one; Telegram, Viber and local integrations are first-class.
- **Agents don't talk to customers directly.** An Agent returns a list of messages and typed fields; a Send message step delivers them, one chat message per item (no walls of text).
- **People can always step in.** Escalation is a branch the user designs. While a person handles a chat, the flow is paused until they hand it back.

## 4. Domain model

Everything hangs off the **agent**; the resources it uses live at **workspace** level.

```
Workspace  (roles, API tokens, secrets, LLM keys, billing)
│
├── Agent ── draft → publish → rollback, A/B tests on versions
│     └── Flow graph ── nodes, edges, triggers; routes on typed outputs
│           uses ──▶ Prompts           (reusable, versioned, variables filled at run time)
│           uses ──▶ Knowledge bases   (sources, sync, index; one search tool per KB)
│           uses ──▶ Tools             (definition + input schema; inline, lambda or endpoint)
│           runs on ─▶ Channels        (Telegram, Viber, WhatsApp, web widget, API, custom adapters)
│
├── Conversations ── messages, escalations, a full trace of every step
├── Contacts ── custom profile fields; memory set per agent
└── Analytics ── metrics, LLM cost, charts from node outputs
```

## 5. Capabilities

### 5.1 Agents and flows
An agent is a **versioned flow graph** built on a canvas. One agent can have several triggers. Every incoming customer message re-runs the flow from its trigger.

**Node types**

| Node | What it does |
|---|---|
| Agent | An LLM with tools and knowledge bases attached; loops through tool calls until it produces its result. Returns `messages[]` plus user-defined typed fields |
| Completion | A single LLM call for simple tasks (classify, extract, rewrite, judge) |
| Router / condition | Chooses the next edge based on variables or a previous node's output |
| Parallel / join | Runs branches at the same time and optionally waits for them |
| Wait | Pauses for a duration or until an event arrives |
| Search knowledge | Searches attached knowledge bases explicitly, outside an agent's own tool use |
| API request | Calls an API or tool deterministically with mapped inputs, no LLM involved |
| Set / extract variable | Writes values into the conversation or the contact profile |
| Send message | Sends text, media, buttons or quick replies to the customer |
| Escalation / exit | Runs the user-designed escalation branch (default: notify a person) or ends the conversation |

**Structured outputs and routing**
- Any Agent or Completion node declares an output schema in a visual schema builder.
- The platform enforces it as structured output, so the node always returns valid typed data.
- Edges route on output fields, e.g. `score > 7`, `intent == "booking"`, `needs_human == true`.
- Outputs become variables for every later node, for analytics and for the API.

**Judge patterns**
- **Guard:** runs in sequence and can route to escalation.
- **Observer:** runs in parallel with the conversation and only records scores or tags; it never interrupts.

**Triggers**
- **Incoming message** on any connected channel.
- **Inactivity timer:** e.g. a follow-up after 2 hours of silence.
- **Schedule / cron:** recurring jobs such as daily digests or reminders.
- **External event:** e.g. "order shipped" from the business's own system. It works as an endpoint or webhook, optionally waiting for the flow's result.
- **Tool event:** e.g. `create_booking` succeeded, which starts its own linked run.

**Escalation.** The default template notifies a person (in the platform, by email or in Telegram). That person continues the conversation in the same chat from the Inbox, and the agent resumes when they hand it back. *(Open: should it also resume automatically after the operator goes quiet?)*

**Customer memory.** Configurable per agent: conversation-only memory, or a persistent **contact profile** with custom fields that nodes can read and write.

### 5.2 Prompts and models
- **Prompt library** per workspace, with folders, search and version history.
- **Variables** in prompts (`{{contact.name}}`, outputs of earlier nodes), with autocomplete.
- **Reuse:** one prompt can back many nodes across agents; a node pins a version or follows the latest.
- **Models:** every Agent and Completion node picks its own model, so a cheap model can score while a strong one converses.
- **Providers:** platform-provided models are included in the subscription; bring-your-own API keys per workspace.

### 5.3 Knowledge bases
Workspace-level resources, attached to agents many-to-many.

**Sources:**
- **Internal storage:** files uploaded, or pages written directly on the platform.
- **External connectors:** Google Docs, Google Drive, Notion, ClickUp and more, through OAuth.
- **Custom sources:** anything else, pushed in through the API.

**Sync modes**, all four available per source:
- one-time import;
- scheduled re-sync;
- manual re-sync (UI button or refresh endpoint);
- real-time (the source's webhook calls our refresh endpoint).

**Under the hood:**
- the platform chunks, embeds and indexes content, showing per-document index status and errors;
- each attached KB becomes a search tool with an editable name and description;
- a **retrieval playground** shows which chunks a query returns, with scores.

### 5.4 Custom tools
A tool has two halves. The **definition** is what the agent sees; the **implementation** is known only to the platform, so the agent never learns the endpoint.

**Definition:**
- name and description;
- input schema (visual or JSON Schema);
- output mapping;
- timeout and retry policy;
- a "requires confirmation" flag for risky actions.

**Implementation** — three hosting modes:

| Mode | Where the code lives | Typical user |
|---|---|---|
| Inline code | JS/TS written in the platform's editor, run in its sandbox | Owner with light coding skills |
| Uploaded function | A JS/TS bundle deployed and run by the platform, like a lambda | Developer |
| External endpoint | The user's own server, called with signed requests | Developer with existing systems |

**Around every tool:**
- a **secrets vault** per workspace;
- **API connections**: saved base URL + auth, shared by API request steps and endpoint tools;
- **test invocation** with sample input;
- **call logs** (input, output, latency, errors, conversation);
- a **built-in tool library** (booking, email, Google Sheets rows, CRM lead).

Screens *(vision)*: `Tools`, `Tools-Connection`, `Tools-Code`.

### 5.5 Channels and adapters
- One agent runs on several channels at once. An adapter layer normalizes messages, media, buttons and delivery events, so flows never depend on a specific messenger.
- **Out of the box:**
  - Telegram, Viber, WhatsApp;
  - an embeddable **web chat widget** with a customizer (colors, avatar, greeting, position, embed snippet);
  - the **API as a channel** (send messages in, receive replies and events back).
- **Custom adapters:** anyone can register one through the public adapter interface. The built-in adapters use the same interface.
- **Channel rules** are surfaced where they affect flows. For example, WhatsApp allows free-form replies only within 24 h of the customer's last message, so later follow-ups need pre-approved templates.

Screen *(vision)*: `Channels` (web widget).

### 5.6 Conversations, Inbox and contacts
- **Inbox:**
  - a live list of conversations;
  - take over and hand back;
  - "why it escalated";
  - the conversation's trace;
  - the contact's profile.
- **Contacts:**
  - a list of people the bots talk to, with custom profile fields;
  - profiles filled by Set/extract variable nodes and readable by flows.

Screens *(vision)*: `Inbox`, `Inbox-Contact`, `Contacts`, `ContactFields`.

### 5.7 Testing and release
- **Simulator:** chat with the draft, pick a simulated channel and contact, and watch the flow run node by node with a live trace.
- **Draft → publish:** publishing creates an immutable version with a changelog; any earlier version can be restored.
- **Eval datasets:** saved test conversations with expected behaviour. Before publishing, the draft runs against them and a user-chosen judge node scores the results.
- **A/B testing:** split live traffic between two published versions by percentage and compare them on any analytics metric.

Screens *(vision)*: `Testing`, `Testing-Versions`, `Testing-Evals`, `Testing-AB`.

### 5.8 Analytics and observability
**Analytics:**
- **Conversation metrics:** volume, resolution, escalation and response time, per channel and agent.
- **LLM cost and usage:** tokens and cost per agent, node and model; subscription quota remaining.
- **Custom charts:** any node output field over time (judge scores, lead scores, topics).
- **Business goals** ("booking made", "lead captured" with conversion rates): *parked for now.*

**Traces** — an own, Langfuse-like area:
- sessions → runs → span tree, with every LLM call, retrieval, tool call and routing decision, plus inputs, outputs, tokens, cost and latency;
- filters and search;
- scores and annotations (observer scores, human notes);
- replay in the simulator; add a conversation to an eval dataset.

Traces are reachable from the Inbox, the simulator and the API.

Screens *(vision)*: `Analytics`, `Traces`, `Traces-Timeline`, `Traces-Sessions`.

### 5.9 Workspace, roles and API
- **Custom roles:** permissions per resource type (agents, KBs, tools, channels, inbox, analytics, billing), optionally per individual agent. The same roles apply to people and machines.
- **API tokens bound to roles:** any script or external AI agent can operate the platform exactly as a user with that role. An **MCP server** can be added later on the same API.
- **Public API:**
  - REST for every resource;
  - outbound webhooks for events (message received, escalation, publish…);
  - agent export and import as JSON.
- **Templates:** curated templates for whole agents, flow snippets and prompts, plus sharing within a workspace.
- **i18n:** Ukrainian and English UI; agents reply in any language the model supports.
- **Billing and usage:** a subscription with included model usage, a usage view and BYOK settings.
- **Developer area:** API reference, webhooks, adapter registration.

Screens *(vision)*: `Settings`, `Settings-Team`, `Settings-Tokens`, `Settings-LLM`, `Settings-Billing`, `Developer`.

## 6. Visual direction
- A **calm workbench** that serves both a salon owner and a developer. The flow canvas is the hero; every other area feels like a tidy side panel to it.
- Surfaces: neutral warm grays and generous whitespace.
- One confident accent color (deep teal).
- A muted hue and icon per node type.
- Type: Onest for the UI; JetBrains Mono for schemas, code, variables and traces.
- Full light and dark themes.
- Comfortable density by default; a compact mode for the builder, traces and tables.
- Tone: plain, friendly copy for owners; technical detail one click away for developers.

The **Design system** page defines every component and variant.

---

# Part 2 — MVP

## 7. MVP goal

The MVP is a platform to **build, test, publish and operate Q&A bots** on **Telegram** and an **API channel**. The bots answer from the business's knowledge base and hand chats to people when needed.

It proves the core loop of the vision — **flow + knowledge + channel + human hand-off** — before adding tools, more channels, contacts and the developer platform.

**Success criteria:**
1. A new user goes from sign-up to a **live Telegram bot that answers from their documents** in about 10 minutes, using the quick-start.
2. A builder can change the flow, **test the draft safely**, **publish a new version** and roll back.
3. No customer is left without an answer. Escalated chats reach an operator with **alerts**, and the operator can take over and hand back.
4. The team sees **how the bots perform** (resolution, escalation, reasons, topics). Tokens and cost per workspace come from our own usage data; LLM traces live in **self-hosted Langfuse**, for the platform team only.

## 8. What the MVP takes from the vision

| Vision capability | In the MVP | How / what's left for later |
|---|---|---|
| Accounts and workspaces | ✅ Yes | Email + password; create a workspace or join by invite link; several workspaces per person |
| Custom roles | ✅ Partly | Built-in + custom roles per resource type. **Later:** per-agent permissions, roles for API tokens |
| Flow graph, versions | ✅ Yes | Draft → simulator → publish → restore |
| Node: Agent | ✅ Yes | Tool: **knowledge search only** |
| Node: Completion | ✅ Yes | Including guard and observer patterns |
| Nodes: Router, Parallel/join | ✅ Yes | |
| Node: API request | ✅ Yes | Inline URL + auth per step. **Later:** shared API connections |
| Node: Send message | ✅ Partly | Text and quick-reply buttons. **Later:** media |
| Node: Escalation / exit | ✅ Yes | Pause, notify, hand back |
| Nodes: Wait, Search knowledge, Set/extract variable | ❌ Later | |
| Structured outputs and routing | ✅ Yes | |
| Trigger: Incoming message | ✅ Yes | |
| Trigger: External event | ✅ Yes | Endpoint and webhook merged into one trigger, optional "wait for result" |
| Trigger: Schedule / cron | ✅ Yes | Covers follow-ups, with conditions like "silent for 24 h" |
| Triggers: Inactivity timer, Tool event | ❌ Later | Inactivity follow-ups are done with Schedule for now |
| Customer memory | ✅ Partly | Conversation-only. **Later:** contact profiles |
| Prompt library | ✅ Yes | Folders, versions, pinning, variables |
| Models and providers | ✅ Yes | A curated list of platform models (the default provider) + bring your own key for OpenAI, Anthropic, Google or any OpenAI-compatible API |
| KB: upload | ✅ Yes | PDF, DOCX, TXT, MD |
| KB: Google Docs, ClickUp | ✅ Yes | |
| KB: Google Drive, Notion, pages written on the platform, custom sources via API | ❌ Later | |
| KB: 4 sync modes, index status, playground | ✅ Yes | |
| Custom tools, secrets vault, tool library | ❌ Later | |
| Channel: Telegram | ✅ Yes | The user pastes a BotFather token; we host the webhook |
| Channel: API | ✅ Yes | Per-channel secret key; replies in the response or to a webhook; external events |
| Channels: Viber, WhatsApp, web widget, custom adapters | ❌ Later | Built on the same adapter layer, which exists internally from day one |
| Inbox: take over, hand back, why escalated | ✅ Yes | |
| Inbox: trace view, contact profile | ❌ Later | "Open in Langfuse" for platform admins instead of a trace view |
| Contacts | ❌ Later | |
| Operator notifications | ✅ Yes | In-platform, email, Telegram |
| Simulator | ✅ Yes | Messages, events and schedules; step-by-step path; Langfuse link for platform admins |
| Eval datasets, A/B tests | ❌ Later | |
| Conversation analytics | ✅ Yes | Plus escalation reasons and topics |
| LLM cost and usage | ✅ Partly | Credits and tokens per workspace in `Settings-Usage`, from our own metering. Per-call detail is in Langfuse for the platform team. **Later:** per agent, step and model charts |
| Custom charts | ❌ Later | |
| Business goals | ⏸ Parked | |
| Own Traces area | ⏸ Optional | Built only if time allows (whole Traces page). Until then, self-hosted Langfuse for the platform team. When ours ships, Langfuse is removed |
| Public API, API tokens, outbound webhooks, export/import, MCP | ❌ Later | The UI still uses one internal API designed so it can be opened later |
| Templates | ✅ Partly | 5 agent templates + "start from scratch" in the quick-start. **Later:** snippets, prompt templates, sharing |
| Quick-start wizard | ✅ Yes | |
| Ukrainian and English UI | ✅ Yes | |
| Billing / subscription | ❌ Later | Monthly **usage limits** only |
| Developer area | ❌ Later | |
| Dark theme, compact density | ❌ Later | The MVP is designed in light theme |

The full-vision screens for the "later" items stay on the **Screens** page.

## 9. Users and roles

| Role | Who | Can |
|---|---|---|
| **Owner** | Created the workspace (one per workspace) | Everything, including deleting the workspace and transferring ownership |
| **Admin** | Team lead | Everything except deleting or transferring the workspace; manages the team and invite link |
| **Builder** | Builds bots | Agents, flows, prompts, knowledge, channels, testing, publishing |
| **Operator** | Answers escalated chats | Inbox only (reply, take over, hand back, close), own profile and notifications |
| **Custom** | e.g. "Content editor" | Any combination from the permission matrix |

**Permission matrix:**
- **Resources:** Agents & flows, Prompts, Knowledge bases, Channels, Inbox, Testing, Analytics, Team & roles, Workspace settings.
- **Actions:** View, Edit, Publish (agents only), Delete.

The UI hides what a role can't use. For example, an operator sees only **Inbox** and **Settings → Profile/Notifications** (`Inbox-Operator`). Opening a page without access shows `NoAccess`.

A person can belong to several workspaces with a different role in each.

## 10. Glossary

- **Workspace:** an organization. All agents, knowledge, channels, people and limits belong to one workspace.
- **Agent (assistant):** a named bot. It has one **draft** and a list of immutable **published versions** (v1, v2…). One version is **live**.
- **Flow:** the graph of triggers and steps inside an agent version.
- **Trigger:** what starts a **run**: an incoming message, an external event or a schedule.
- **Step:** a node in the flow (Agent, Completion, Router…).
- **Run:** one execution of the flow. It is traced in Langfuse.
- **Conversation:** all messages between one end user and one agent on one channel. A run belongs to a conversation.
- **Channel:** where end users talk. It is either a Telegram bot or an API channel. A channel is answered by **one agent** (its live version); an agent can be on several channels.
- **Knowledge base (KB):** a named, searchable collection of chunks built from sources. KBs are attached to Agent steps.
- **Prompt:** a versioned text template in the library, used by Agent and Completion steps.
- **Escalation:** the flow hands the conversation to people. The flow is **paused** for that conversation until an operator hands it back.
- **Operator:** a person who replies in the Inbox.

---

## 11. Use cases

Each use case lists the main path, then variations and errors, and the screens involved. The **MVP flows** page shows the same paths as connected screens.

### UC-1 · Sign up and create a workspace
*Actor: new user · Map: Flow 1 "Account & access"*

1. Sign up with name, email and password (at least 10 characters) → `Auth-SignUp`.
2. We email a confirmation link (valid 24 h) → `Auth-CheckEmail`.
3. The link opens "Create or join a workspace". The user names the organization and becomes its Owner → `Auth-Workspace`.
4. The user lands on the first-run Agents page with a 4-step checklist → `Agents-Empty`.

**Variations:**
- Email already registered → `Auth-SignUp-Taken` (log in or reset instead).
- Confirmation link expired → `Auth-ConfirmExpired` (send a new one).
- Logging in before confirming → `Auth-Login-Unconfirmed`.

### UC-2 · Log in and recover a password
1. Log in → `Auth-Login` (error state: wrong email or password) → `Agents`.
2. Forgot password → `Auth-Forgot` (reset link valid 1 h) → `Auth-Reset` → logged in.

### UC-3 · Invite a teammate and join by link
*Actors: owner or admin, invited person*

1. In `Settings-Team`, the owner or admin copies the **invite link**.
   - They pick the role new members get (e.g. Operator).
   - The link expires after a set time, and they can **reset** it.
2. The teammate opens the link.
   - **No account:** they sign up through the invite → `Auth-InviteSignUp`.
   - **Has an account:** they log in first → `Auth-Login`.
3. They confirm joining → `Auth-Invite`. An operator lands in the Inbox with only their allowed navigation → `Inbox-Operator`.
4. The operator links Telegram for alerts → `Settings-Notifications-Link`.

**Variations:**
- Invalid or reset link → `Auth-InviteInvalid`.
- An operator opens a builder URL → `NoAccess`.

### UC-4 · Launch the first bot with the quick-start
*Actor: owner or builder · Map: Flow 2 "Build & launch"*

1. **Template and name** → `QuickStart-Template`. Templates:
   - FAQ with hand-off
   - FAQ from documents
   - Scheduled follow-up
   - Event notifications
   - Questions with routing
   - Start from scratch
2. **Knowledge:** upload files or connect Google Docs or ClickUp into a new or existing KB. A "Try it as you go" preview answers from what has been added so far → `QuickStart`.
3. **Channel:** Telegram (paste a BotFather token) and/or API → `QuickStart-Channel`.
4. **Publish:** a checklist summary, plus who gets escalation alerts and how → `QuickStart-Publish`.
5. **Live:** links to the bot, the API key, the flow builder, team invites and alert setup → `QuickStart-Live`.

**Variations:**
- Telegram rejects the token → `QuickStart-Channel-Error`.
- "Start from scratch" → empty flow with only an Incoming message trigger → `FB-Blank`.

### UC-5 · Build and change the flow
*Actor: builder · Screens: `FlowBuilder` + one inspector per step*

1. Open an agent from `Agents`. The canvas shows the **draft**; the palette lists triggers and steps.
2. Add or connect steps and configure each in the right-hand inspector:
   - `FB-Trigger-Message`, `FB-Trigger-Event`, `FB-Trigger-Schedule`
   - `FlowBuilder` (Agent step)
   - `FB-Completion`, `FB-Parallel`, `FB-Router`, `FB-ApiRequest`, `FB-SendMessage`, `FB-Escalation`
3. Attach knowledge bases to Agent steps and pick prompts from the library (pinned version or "follow latest").
4. Edits are saved to the draft. **Customers keep talking to the live version.**

### UC-6 · Test, publish, roll back
1. **Simulator** (`Testing`):
   - Chat as a test user, choosing the simulated channel and language.
   - See which steps ran, the guard and agent outputs, the knowledge used, timings. Platform admins also get a link to the run in Langfuse.
2. Test **events and schedules** without waiting → `Testing-Event`.
3. Test a **hand-off**: see the escalation path and "reply as operator" → `Testing-Escalation`.
4. **Publish** (`FB-Publish`):
   - The modal shows the changes since the live version, checks (every step connected, tested, warnings) and a release note.
   - The new version goes live immediately. Runs already in progress finish on the old version.
5. **Versions** (`Testing-Versions`): history with notes; compare.
6. **Restore** an old version: it is copied into the draft (replacing unpublished changes) and must be published again → `Testing-Versions-Restore`.

### UC-7 · Manage prompts
*Screen: `Prompts`*

- Folders of prompts; an editor with `{{variable}}` autocomplete (user.*, message.*, channel, outputs of earlier steps).
- Saving creates a new version (v5…).
- "Where it's used" shows every step and agent version that uses the prompt and whether it is **pinned** (keeps its version) or **following latest** (gets the new version on save).
- Test the prompt; compare versions.

### UC-8 · Build a knowledge base
*Map: Flow 3 "Prompts, knowledge & channels"*

1. Create a KB → `Knowledge-Empty`.
2. Add sources (`Knowledge-AddSource*`):
   - **Upload:** PDF, DOCX, TXT, MD, up to 20 MB each. Unsupported files are skipped with a reason. Uploads don't sync; uploading a new version replaces the old chunks.
   - **Google Docs:** connect an account (read-only), pick documents or a folder.
   - **ClickUp:** connect (read-only), pick docs from a space.
   - **Sync mode** per source: one-time import, scheduled re-sync (hourly, daily or weekly at a time), manual (button or refresh endpoint), or real-time (re-index on change).
3. Watch the index status for each source (`Knowledge`):
   - indexed with N chunks, indexing %, or an error such as "access revoked" → reconnect;
   - re-sync one source or all.
4. Set **how agents see the KB**: the search-tool name and description the LLM receives.
5. Check retrieval in the **playground**: query → top results with scores.
6. Attach the KB to an Agent step.

**Deleting a KB** warns which agents and versions use it → `Knowledge-Delete`.

### UC-9 · Connect channels
**Telegram:**
1. Paste the BotFather token → `Channels-Telegram-New`. We validate it and register our webhook.
2. Pick the answering agent → `Channels`.
3. See the webhook status, last update and 7-day stats.
4. If the token is revoked or regenerated, the channel shows `Channels-Telegram-Broken` and owners and admins get an email; the fix is to replace the token.
5. Disconnecting asks for confirmation → `Channels-Telegram-Disconnect`.

**API:**
1. Create a channel (name, agent, reply mode, webhook) → `Channels-API-New`.
2. Copy the **secret key, shown once** → `Channels-API-Key`.
3. See and configure the endpoint, reply mode and webhook for later messages → `Channels-API`.
4. **Rotate** the key: the old key keeps working for 24 h.
5. **Delete** with name confirmation → `Channels-API-Delete`.

### UC-10 · A customer conversation (runtime)
*Map: Flow 4 "A conversation, end to end"*

1. A customer writes in Telegram, or the business's system calls the API.
2. The Incoming message trigger starts a run of the **live version**.
3. A typical Q&A flow:
   - **Parallel:** a **Guard** (Completion: needs_human?) and an **Observer** (Topic tagger, which feeds analytics) run together.
   - **Router:** needs a person? → **Escalation**; otherwise → **Agent** (searches the KB, returns `messages[]`) → **Send message** (one chat message per item).
4. The conversation shows in Inbox → **Live**.

**If a step fails**, it retries, then follows its fallback:
- the API request continues without data;
- the Agent step escalates.

The run is marked failed, and Agents shows "N runs failed today".

### UC-11 · Escalation and the operator hand-off
*Actor: operator*

1. The Escalation step sends its message to the customer, **pauses the flow** for the conversation, and notifies operators:
   - in-platform, by email and in Telegram, depending on each person's settings → `Operator-Alerts`;
   - the alert includes the reason, e.g. `{{guard.reason}}`.
2. The chat waits in Inbox → **Needs you** → `Inbox-Waiting`.
3. An operator clicks **Take over** → `Inbox`.
   - They see why it escalated (guard output, the path of the run, who was notified; platform admins also get a link to Langfuse).
   - They reply; for API chats, replies go to the channel's webhook.
4. **Hand back** to the agent: the flow resumes on the next customer message → `Inbox-HandedBack`.
5. Or **close** the chat, with an optional closing message → `Inbox-Close`. The next message from the customer starts a new conversation with the agent → `Inbox-Empty`.

**Variations:**
- Another operator already took it → read-only view with "Take over from X" → `Inbox-Taken`.
- Nobody takes the chat: the step reminds operators after 5 min; after 30 min it tells the customer "we'll reply later".

### UC-12 · Events and scheduled follow-ups
- **External event:** the business's system POSTs to `/channels/{id}/events` with an event name and payload (`event.*` variables; `user_id` picks the conversation).
  - The matching trigger runs its branch, e.g. API request "Load booking" → Completion "Write confirmation" → Send message.
  - The caller either gets **202 Accepted** ("don't wait") or **waits for the result**: the flow's messages come back in the response, up to 30 s.
- **Schedule:**
  - Runs on a cron (every day, weekdays or custom; time and time zone) once per matching conversation.
  - Conditions: e.g. last customer message more than 24 h ago, not escalated, channel = Telegram.
  - Limits: max conversations per run; once per conversation.
  - Telegram only allows messaging users who already wrote to the bot.

### UC-13 · Manage agents
*Map: Flow 5 "Workspace & admin"*

- `Agents` lists agents with their status (Live vN / Draft / Paused), channels and 7-day stats (chats, % resolved, % escalated).
- A "Needs attention" panel shows:
  - chats waiting for a person
  - unpublished drafts
  - knowledge sync errors
  - failed runs
  - usage against the limit
- The row menu (`Agents-RowMenu`) has open, test, **pause**, duplicate and **delete**.
- **Pause** (`Agents-Pause`): the channels stop running the flow; new messages go to the Inbox ("Needs you"), or the customer gets an away message.
- **Delete** (`Agents-Delete`): type the name to confirm. Channels are left without an agent; history stays.

### UC-14 · Administer the workspace
- **Profile** → `Settings-Profile`: name, email change (with confirmation), password, interface language, list of workspaces (leave), log out.
- **Notifications** → `Settings-Notifications`:
  - per person, toggles for in-platform, email and Telegram;
  - Telegram linking with a one-time code sent to the alerts bot → `Settings-Notifications-Link`.
- **General** → `Settings-General`:
  - name, time zone (used by schedules and analytics), default language;
  - transfer ownership → `Settings-Team-Transfer`;
  - delete the workspace, typing the name + password → `Settings-General-Delete`.
- **Team** → `Settings-Team`: invite link, change a member's role, remove a member → `Settings-Team-Remove`.
- **Roles** → `Settings`: the permission matrix, create a custom role → `Settings-Roles-New`.
- **LLM keys** → `Settings-LLM`:
  - the platform's curated models are available by default;
  - add your own key per provider (OpenAI, Anthropic, Google, OpenAI-compatible) (checked on save, stored encrypted, never shown again) → `Settings-LLM-AddKey`.
- **Usage** → `Settings-Usage`:
  - this month's platform-model usage, conversations and knowledge storage against the limits;
  - at 100%, see UC-15 → `Agents-LimitReached`.
- **Workspace/account menu** → `Agents-AccountMenu`: switch workspace, create or join another, profile, log out.

### UC-15 · Usage limits
- Each workspace has monthly limits on:
  - platform-model usage, in **credits** (1 credit = $0.001 of provider cost)
  - conversations
  - knowledge chunks
- Owners get emails at 80% and 100%.
- At 100%:
  - agents on **platform models** stop answering and new chats go to the Inbox;
  - steps using the workspace's **own keys** keep working;
  - a banner shows on every page until the reset on the 1st of the month.
- "Ask for a higher limit" is a manual request; there is no billing.

### UC-16 · See how the bots perform
*Screen: `Analytics`*

- Filters: agent, channel, period (7, 30 or 90 days).
- **KPIs:**
  - conversations
  - % resolved by the agent (no person needed)
  - % escalated
  - median time for a person to pick up an escalated chat
- **Charts:**
  - conversations per day
  - breakdown by channel
  - escalation reasons (`guard.reason`)
  - topics (from the Topic tagger observer)
- Token usage and LLM cost are in `Settings-Usage`; LLM traces are in Langfuse for the platform team.

---

## 12. Functional requirements by module

### 12.1 Accounts and workspaces
- Email + password; password at least 10 characters.
- The confirmation link is valid 24 h; the reset link 1 h.
- Rate-limit log-in, sign-up and reset.
- One user ↔ many workspaces (membership with a role). The workspace switcher is in the sidebar.
- Invite link:
  - one active link per workspace with a role and an expiry;
  - reset invalidates the old link;
  - joining with an existing account requires logging in.
- Ownership transfer needs the password; the old owner becomes Admin.
- Workspace deletion needs the name + password and removes everything except traces already in Langfuse.

### 12.2 Roles and permissions
- 4 built-in roles (not editable) plus custom roles (create, duplicate, edit, delete if unused).
- Enforced **on the API**, not only in the UI. Navigation hides inaccessible sections; direct URLs show No access.

### 12.3 Agents
- **States:**
  - Draft (never published)
  - Live vN (+ optional unpublished draft)
  - Paused
- **Pause options:** the user picks one in the pause dialog: route new messages to the Inbox, or reply with an away message they write, sent once per conversation per pause. Schedules and events are skipped while paused.
- **Duplicate** copies the draft flow (not channels).
- **Delete** removes the flow and versions and leaves conversations readable.

### 12.4 Flow builder — triggers

| Trigger | Configuration | Variables provided |
|---|---|---|
| **Incoming message** | Which channels (of those connected to this agent) | `message.text`, `message.attachments`, `user.name`, `user.language`, `channel`, `history` (the whole conversation) |
| **External event** | Event name; source API channel; example payload; caller mode "don't wait" / "wait for result" (≤30 s) | `event.*`, `user_id` → conversation |
| **Schedule / cron** | Every day / weekdays / custom cron; time; time zone; conditions on conversations; max per run; once per conversation | conversation context, `history` |

- Message types: text runs the flow; photos and files are passed as attachments; voice is ignored.
- **While a person handles a chat, the message trigger does not run.** Messages go to the Inbox.

### 12.5 Flow builder — steps

| Step | Purpose | Configuration |
|---|---|---|
| **Agent** | LLM with the KB-search tool; runs once per customer message; **never messages the customer itself** | Prompt (library, pin vN or follow latest); model; attached KBs; structured output with built-in `messages[]` (list of text) + custom fields; **if the model fails:** retry 2× then escalate |
| **Completion** | One LLM call, no tools, structured output | Prompt; model; input (the whole history, current message); output fields; **role: Guard** (in sequence, can stop the flow) or **Observer** (in parallel, output goes to analytics/Langfuse, can't stop the flow) |
| **Parallel / join** | Run branches at the same time | Continue when: guard branches finish (observers keep running) / all finish / the first finishes |
| **Router** | Branch on conditions | Ordered rules `field op value → target`, first match wins; `else` target; fields from triggers and earlier steps (observers excluded) |
| **API request** | Call the business's systems (no LLM) | Method, URL with variables, headers/body, auth (Bearer token stored encrypted); output `status`, `body`; timeout (default 5 s); retries (default 2 with backoff); **on failure:** continue without data or escalate |
| **Send message** | The only step that talks to the customer | From a list variable (one chat message per item) or written text with variables; "typing…" before each; wait for delivery; optional quick-reply buttons (static or from an output field) |
| **Escalation / exit** | Hand to people or end | Mode: escalate / end conversation; message to the customer; who to notify (operators or a role) and channels (in-platform, email, Telegram); reason variable shown in the Inbox; reminder after N min; fallback message if nobody replies in N min |

- **Variables:** `{{step_name.field}}`, `{{user.*}}`, `{{message.*}}`, `{{event.*}}`, `{{channel}}`, `{{today}}`.
- **Validation before publish:**
  - every step is reachable and connected;
  - required fields are filled;
  - warnings, e.g. no fallback text.

### 12.6 Prompt library
- Folders; prompts with immutable versions plus one editable draft.
- Variables with autocomplete.
- "Where used" per version; steps pin a version or follow latest.
- Test a prompt with sample inputs; compare two versions (diff).

### 12.7 Knowledge
- KB = name, description and search-tool name + description (what the LLM sees).
- **Sources:**
  - upload (PDF, DOCX, TXT, MD, ≤20 MB)
  - Google Docs (docs or folder, read-only OAuth)
  - ClickUp (docs from a space, read-only)
- **Sync modes:**
  - one-time
  - scheduled (hourly / daily / weekly at a time)
  - manual (UI button + refresh endpoint)
  - real-time (provider change notifications / webhooks)
- **Pipeline:** fetch → parse → chunk → embed → index. Status per source:
  - indexed with chunk count
  - indexing %
  - error with reason (access revoked, unsupported file…)
  - last sync time
- Re-sync replaces that source's chunks atomically (agents never see a half-indexed source).
- Retrieval playground: query → top 3 chunks with scores and source.
- Deleting a KB warns about the agents and versions that use it.

### 12.8 Channels
- **Telegram bot:**
  - validate the token with Telegram; set the webhook to our endpoint;
  - store the token encrypted; show only a masked version;
  - status: receiving / not receiving; last update; 7-day chats, messages and errors;
  - detect a revoked token (webhook errors) → broken state + email to owners and admins;
  - replace the token, disconnect (removes the webhook).
- **API channel:**
  - `POST /v1/channels/{id}/messages` with `Authorization: Bearer <secret>` and body `{ user_id, text }`.
  - **Reply mode:**
    - *In the response:* waits for the flow (≤30 s) → `{ conversation_id, messages[], status: answered | escalated }`.
    - *To my webhook:* 202, then POSTs replies to the webhook.
  - **Webhook for later messages** (operator replies, follow-ups, event messages): required for any agent that can escalate or message proactively.
  - `POST /v1/channels/{id}/events` with `{ event, user_id, …payload }`.
  - **Secret key:** shown once, stored hashed. Rotate → the new key is shown once and the old one stays valid for 24 h.
  - The same `user_id` continues the same conversation.
- One channel → one agent (its live version). One agent → many channels.

### 12.9 Conversation runtime
- The conversation state machine:

  ```
  agent_active ──escalate──▶ waiting ──take over──▶ handled_by(user)
       ▲                                                 │
       └───────────────hand back─────────────────────────┤
                                                         └──close──▶ closed
  ```

  A new message after `closed` starts a new conversation.
- Runs execute on the live version that was current when the run started.
- Each run is traced in Langfuse:
  - trace = run, session = conversation;
  - steps as spans, LLM calls as generations with tokens and cost;
  - the trace URL is stored on the run for "Open in Langfuse" links;
  - those links are shown to **platform admins only**, because one Langfuse project holds all workspaces;
  - tracing can be turned off (`LANGFUSE_MODE = off`) and bots keep working; only the links disappear.
- Per-step timeouts and retries; a failed run is recorded and counted for Agents → Needs attention.
- Drafts run **only** in the simulator. Simulator runs never notify anyone and never use real channels.

### 12.10 Inbox
- **Tabs:**
  - Needs you (waiting + taken by me)
  - Live (agent answering)
  - Closed
- Filter by channel and agent; search.
- Conversation view: messages with author (customer / agent / operator), system dividers (escalated, taken over, handed back).
- Details panel: the escalation reason and guard output, the path of the run, agent and version, channel, who was notified, Langfuse link (platform admins only).
- **Actions:**
  - take over (pauses the agent)
  - reply
  - hand back
  - close with an optional closing message
  - take over from another operator
- Only one operator handles a chat at a time; others see it read-only.
- The Inbox count in the navigation = chats in "Needs you".

### 12.11 Notifications
- Triggered by Escalation steps (and reminders); recipients come from the step config.
- **Per-person channel toggles:**
  - **In-platform:** Inbox badge + browser notification.
  - **Email:** reason, last customer message, "Open in Inbox".
  - **Telegram:** a shared alerts bot. The user links their Telegram with a 10-minute one-time code; the message has "Open in Inbox".
- System emails: confirmation, reset, usage at 80/100%, Telegram token revoked.

### 12.12 Testing and release
- The simulator has three tabs:
  - **Message:** chat as a test user; simulated channel and language.
  - **Event or schedule:** pick a trigger, edit the payload, run now against a test conversation.
  - **Escalation:** "reply as operator" to test hand-back.
- Turn details: duration, steps run, messages sent, guard output, agent output, knowledge used, Langfuse link (platform admins only).
- **Publish:**
  - diff vs. live, checks, release note;
  - atomic switch; in-flight runs finish on the old version.
- **Versions:**
  - list with author, date and notes; compare any two;
  - restore = copy into the draft (with a warning about losing draft changes).

### 12.13 Analytics (built in, simple)
- Computed from our own conversation and run data (not from Langfuse):
  - conversations
  - resolved by agent (closed or ended without escalation)
  - escalated
  - median pick-up time
  - per day, per channel
  - escalation reasons
  - topics
- Workspace time zone; filters by agent, channel and period.

### 12.14 LLM providers and limits
- **One provider abstraction.** The platform's own account is the **default provider**; providers a workspace adds with its own key sit on the same level.
- **Platform models:** a curated list of tested models with prices, each with a fallback model from another vendor (used once on errors or timeouts). Defaults: a conversation model for Agent steps and a light model for Completion steps.
- **Bring your own key:** OpenAI, Anthropic, Google, or any OpenAI-compatible API. Validated on save, encrypted, never shown again; usage is not counted toward the limit.
- Each Agent or Completion step stores its **provider + model**.
- Platform-model usage is metered in **credits** at provider cost (1 credit = $0.001).
- Usage metering per workspace per month; enforcement as in UC-15.

### 12.15 Localization
- UI languages: English and Ukrainian, switchable per person (sidebar switch and profile) → `Agents-Empty-UK`.
- The bot's reply language is driven by prompts (`user.language` is available).

---

## 13. Non-functional requirements

- **Security:**
  - all secrets (bot tokens, provider keys, API-request credentials) are encrypted at rest and never returned by the API;
  - channel secret keys are hashed;
  - permissions are enforced server-side;
  - audit "added by" / "edited by" on keys, versions and members.
- **Reliability:**
  - idempotent handling of Telegram updates and API calls (dedupe by update/message id);
  - step retries with backoff;
  - the run queue survives restarts.
- **Latency targets:** a simple Q&A turn is answered in a few seconds; API "in the response" mode times out at 30 s.
- **Observability:**
  - Langfuse (self-hosted) for LLM traces, tokens and cost;
  - platform metrics and logs separately (e.g. Prometheus + Grafana): queue depth, run durations, failures, webhook errors, sync jobs.
- **Data:** conversations are kept until the agent or workspace is deleted; deletion removes our data (Langfuse retention is managed in Langfuse).

## 14. MVP data model (sketch)

Leave room for the vision entities (Contact, Tool, Secret, ApiToken, EvalDataset, Experiment) without building them now.

```
User ─< Membership >─ Workspace ─< Role (built-in | custom, permissions)
Workspace ─ InviteLink (role, expires_at, token)
Workspace ─< Agent ─< AgentVersion (n, status: draft|published, flow JSON, note, author)
                  └─ live_version_id, paused
Workspace ─< Prompt ─< PromptVersion (n, text, variables)        Folder
Workspace ─< KnowledgeBase ─< Source (type, sync_mode, schedule, status) ─< Chunk (embedding)
Workspace ─< Channel (type: telegram|api, agent_id, encrypted token | key hash, reply_mode, webhook_url)
Workspace ─< ProviderKey (provider, encrypted key)
Channel ─< Conversation (end_user_id, state, handled_by, closed_at) ─< Message (author, text)
Conversation ─< Run (version_id, trigger, status, langfuse_trace_id, error)
Run ─< Escalation (reason, notified, taken_by, taken_at)
User ─ NotificationSettings (in_app, email, telegram_chat_id)
Workspace ─ UsageCounter (month, credits, conversations, chunks)
```

## 15. MVP screen index

| Module | Screens |
|---|---|
| Auth | `Auth-SignUp`, `Auth-SignUp-Taken`, `Auth-CheckEmail`, `Auth-ConfirmExpired`, `Auth-Workspace`, `Auth-Login`, `Auth-Login-Unconfirmed`, `Auth-Forgot`, `Auth-Reset`, `Auth-Invite`, `Auth-InviteSignUp`, `Auth-InviteInvalid` |
| Agents | `Agents-Empty`, `Agents-Empty-UK`, `Agents`, `Agents-RowMenu`, `Agents-Pause`, `Agents-Delete`, `Agents-LimitReached`, `Agents-AccountMenu` |
| Quick-start | `QuickStart-Template`, `QuickStart`, `QuickStart-Channel`, `QuickStart-Channel-Error`, `QuickStart-Publish`, `QuickStart-Live` |
| Flow builder | `FlowBuilder` (Agent step), `FB-Blank`, `FB-Trigger-Message`, `FB-Trigger-Event`, `FB-Trigger-Schedule`, `FB-Completion`, `FB-Parallel`, `FB-Router`, `FB-ApiRequest`, `FB-SendMessage`, `FB-Escalation`, `FB-Publish` |
| Prompts & knowledge | `Prompts`, `Knowledge-Empty`, `Knowledge`, `Knowledge-AddSource` (Google Docs), `Knowledge-AddSource-Upload`, `Knowledge-AddSource-ClickUp`, `Knowledge-Delete` |
| Channels | `Channels-Empty`, `Channels-Telegram-New`, `Channels`, `Channels-Telegram-Broken`, `Channels-Telegram-Disconnect`, `Channels-API-New`, `Channels-API-Key`, `Channels-API`, `Channels-API-Delete` |
| Inbox | `Inbox`, `Inbox-Waiting`, `Inbox-Taken`, `Inbox-HandedBack`, `Inbox-Close`, `Inbox-Empty`, `Inbox-Operator`, `Operator-Alerts`, `NoAccess` |
| Testing & analytics | `Testing`, `Testing-Event`, `Testing-Escalation`, `Testing-Versions`, `Testing-Versions-Restore`, `Analytics` |
| Settings | `Settings-Profile`, `Settings-Notifications`, `Settings-Notifications-Link`, `Settings-General`, `Settings-General-Delete`, `Settings-Team`, `Settings-Team-Remove`, `Settings-Team-Transfer`, `Settings` (roles), `Settings-Roles-New`, `Settings-LLM`, `Settings-LLM-AddKey`, `Settings-Usage` |
| Flow maps | `Flow-Access`, `Flow-Build`, `Flow-KnowledgeChannels`, `Flow-Conversation`, `Flow-Workspace` |

## 16. Suggested build order

1. **Foundation:** auth, workspaces, membership, built-in roles, invite link, app shell (EN/UK).
2. **Knowledge & prompts:** KB with upload first, then Google Docs and ClickUp with sync modes; prompt library with versions.
3. **Flow engine + builder:** flow JSON format, run queue, Incoming message trigger, Agent (KB search), Completion, Router, Parallel, Send message; Langfuse tracing; simulator.
4. **Channels & release:** Telegram and API channels; publish, versions, restore; quick-start.
5. **Operate:** Escalation step, Inbox (take over, hand back, close), notifications (in-app, email, Telegram alerts bot).
6. **Proactive & admin:** External event and Schedule triggers, API request step, analytics, usage limits, BYO keys, custom roles, remaining confirmation and error states.

## 17. Open questions

1. ~~**Paused agent default**~~ — resolved: the user chooses in the pause dialog: new messages go to the Inbox, or get an away message written by the user, sent once per conversation per pause.
2. ~~**Closing a chat**~~ — resolved: the customer's next message starts a fresh conversation with the agent.
3. **API channel without a webhook:** block publishing an agent that can escalate or message proactively, or only warn?
4. **Real-time sync:** feasibility for Google Docs (Drive change notifications) and ClickUp (webhooks); fall back to frequent scheduled sync if limited.
5. **Limit values:** the design uses placeholders (e.g. 10,000 conversations, 5,000 chunks per month). Set the real numbers.
6. ~~**Platform models**~~ — resolved: no tiers; a curated model list (`architecture.md` D81–D84, D90).
7. ~~**Conversation history window**~~ — resolved: no limit; steps get the whole conversation (`architecture.md` D192). Compaction can be added later in one place if it is ever needed.
8. **Escalation auto-resume** (open in the vision too): should the agent also resume automatically after the operator goes quiet? The MVP resumes only on an explicit hand-back.
