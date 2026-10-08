# SatsunicGo

Shopping and purchase assistance from the US, Japan, and Korea to Vietnam, with Ask Anything as a way to find a product, understand the costs, and continue with a purchase request.

## Taking one AI project all the way

After a lot of AI experiments, unfinished prototypes, and more burned tokens than I would like to count, I wanted to take one personal product all the way: build it, put it in front of customers, run the service, and see whether it can earn real money.

That product is SatsunicGo.

The starting point is fairly ordinary. Someone finds a pair of shoes on a US website and wants to buy them. Before they can do that, they need to work out the size, find a purchase assistance service, read the fees, fill in a form, and ask about shipping. Change the quantity halfway through, and there is another round of explaining.

I had already built Ask Anything on [HunpeoLabs](https://hunpeolabs.com) so visitors could ask about me and my work. With SatsunicGo, I wanted to carry that idea into shopping: let people say what they need, ask a few questions, and keep going from the same place.

The longer story is in [SatsunicGo: Making Overseas Shopping Feel More Like a Conversation](https://hunpeolabs.com/resources/blog/satsunicgo-building-an-applied-ai-shopping-product). This repository is where I am building it.

## “Can you help me buy this?”

Someone might arrive with a link and a clear request:

> “Can you get these shoes from the US? I usually wear size 38.”

Then come the details: which size chart applies, what shipping includes, and which costs still need a quote. If the customer decides to go ahead, Ask should help collect the missing information and show the request for them to check. “Actually, get two pairs” should carry the change forward without starting the whole conversation again.

Other questions are just as practical:

> “How much for two bottles, including shipping to Vietnam?”
>
> “Has my order from last week reached Vietnam?”

People should be able to ask those questions without knowing where the service keeps its information. The usual product pages, forms, and account screens remain available; the conversation gives them another way through the task.

That is the experience I am working toward. Ask still needs work, particularly around context, retrieval, and the steps between a useful answer and a completed request.

## The work behind the conversation

A purchase still moves through the business: reviewing the request, quoting, getting the customer's approval, purchasing, checking the goods, packing, and shipping. SatsunicGo includes the customer screens and staff workspace for that work, alongside payments, membership, support, and content management.

The distinctions around orders and money matter. A prepared request stays a draft until the customer submits it. Payment confirmation comes from the payment system. Order progress comes from the customer's actual order record. If a customer approves one pair of shoes and then changes it to two, the changed request needs another confirmation.

Ask helps people understand and reach these steps. The application checks access and handles the business action. When information cannot be checked, the conversation needs to make that clear.

## The Lego pieces behind Ask

I think of the design as a few Lego pieces that need to fit together. The LLM interprets the question and explains the response. Knowledge supplies product and service information. Tools look up current facts or prepare the next step. The backend checks who is asking, what they can access, and what action they have confirmed.

The code uses React, TypeScript, and Vite for the web application; Firebase Authentication, Firestore, Storage, and Cloud Functions for identity and business data; and Genkit with Gemini for the model integration. Shared domain modules hold validation and business rules. payOS is part of the payment integration.

The broader agent design also needs limits on steps, time, and model usage, along with cancellation and a record of what happened. These are part of the direction being built; describing the design here does not mean every part has been accepted in production.

## Context is where I am spending a lot of time

Ask can still be a little clumsy. It can miss the point, ask an unnecessary question, or receive too much background. Getting the right information into the model at the right moment takes more work than adding an input box.

Chunking is a good example. A shipping policy might give a rate, followed by the conditions for using it. Retrieve the rate without those conditions, and the answer can read well while leaving the customer with the wrong expectation. I am working on keeping useful sections together and preserving their sources.

Some information can come from a document. Other information changes: an order status needs a fresh, authorised lookup. Longer conversations bring another problem. Older discussion can be summarised, but the selected item, draft request, and pending confirmation need to remain application state.

There is no vector database in the current retrieval implementation. I am starting with a bounded knowledge collection and targeted lexical retrieval. I want to see where that approach falls short before adding semantic retrieval and another component to operate.

## What I want to learn from real use

My priority is to make the everyday journeys dependable: finding a product, understanding the fees, preparing a purchase request, confirming it, and checking an order. Then I can learn where people get stuck, which answers lack enough evidence, and what each useful interaction costs.

Understanding customer activity is another part of the design, with its own privacy and consent work. A product view, a submitted request, and a payment each mean different things. That distinction needs to survive any reporting built around them.

This repository contains the implementation and ongoing work toward that rollout. Local tests and emulator sessions help develop it; real authentication, payment, model access, and operational acceptance require their own verification. Current release and setup details belong in the linked project documents below.

## Finding your way around the repo

| Path               | What lives there                                                    |
| ------------------ | ------------------------------------------------------------------- |
| `src/`             | Public pages, customer account, Ask, and staff workspace            |
| `functions/src/`   | Server handlers, business commands, integrations, and AI services   |
| `packages/domain/` | Shared validation, pricing, order lifecycle, and other domain rules |
| `tests/`           | Unit, Security Rules, HTTP, and browser checks                      |
| `scripts/`         | Local tooling, demo utilities, and release checks                   |
| `docs/`            | Architecture, plans, reviews, and operating notes                   |

Start with [architecture and data boundaries](docs/ARCHITECTURE_AND_DATA.md), [external setup requirements](docs/EXTERNAL_SETUP_REQUIRED.md), and the [operations runbook](docs/OPERATIONS_RUNBOOK.md). The [release guide](docs/releases/CICD-108.md) describes the release pipeline. [AGENTS.md](AGENTS.md) defines the current shared development environment; older ports in the [local runbook](docs/LOCAL_RUNBOOK.md) describe earlier demo setups.

## Install and run

### Requirements

- Node.js **22** and npm, matching the Functions runtime and CI.
- Java **21 or newer** when running Firebase emulators.
- Git. Firebase CLI is included in the project's development dependencies.

### Install

```bash
git clone https://github.com/phamhungptithcm/SatsunicGo.git
cd SatsunicGo
npm ci
```

The root npm workspace installs the frontend and Functions dependencies together.

### Configure local development

For a fresh checkout, create `.env.local` with these demo values. Keep an existing local configuration if one is already in use.

```dotenv
VITE_FIREBASE_API_KEY=demo-only
VITE_FIREBASE_AUTH_DOMAIN=demo-satsunicgo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-satsunicgo
VITE_FIREBASE_APP_ID=demo-only-app
VITE_FIREBASE_STORAGE_BUCKET=demo-satsunicgo.appspot.com
VITE_FIREBASE_REGION=asia-southeast1
VITE_USE_EMULATORS=true
VITE_AUTH_EMULATOR_PORT=19207
VITE_FIRESTORE_EMULATOR_PORT=18207
VITE_FUNCTIONS_EMULATOR_PORT=15207
VITE_GOOGLE_CLIENT_ID=
VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=
VITE_BETA_RELEASE=false
```

These are synthetic local values. `.env.local` is ignored by Git. For an authorised Firebase environment, [.env.example](.env.example) lists the browser configuration fields; payment credentials and other server secrets belong in the server's approved configuration.

### Run the frontend

The shared frontend is **http://127.0.0.1:5207**. Check whether it is already running before starting it. On macOS or Linux:

```bash
lsof -nP -iTCP:5207 -sTCP:LISTEN
```

If there is a listener, reuse that server. Otherwise, with the backend emulators running:

```bash
npm run dev -- --port 5207 --strictPort
```

Open **http://127.0.0.1:5207**. If the port is occupied, coordinate with the person using it; `--strictPort` keeps Vite from silently choosing another port.

### Start the backend on a fresh machine

Skip this step when using the team's running emulators. The shared configuration is `/private/tmp/satsunicgo-shared5207/firebase.json`, with Auth **19207**, Firestore **18207**, Functions **15207**, and Storage **19208**. Preserve demo data and coordinate any restart.

For a new local environment with those ports free, create an ignored config that points back to the repository's Functions and rules:

```bash
mkdir -p .ai/local
node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const config = JSON.parse(readFileSync('firebase.json', 'utf8'));
const local = {
  functions: config.functions.map(({ predeploy, ...entry }) => ({
    ...entry, source: resolve(entry.source),
  })),
  firestore: {
    rules: resolve(config.firestore.rules),
    indexes: resolve(config.firestore.indexes),
  },
  storage: { rules: resolve(config.storage.rules) },
  emulators: {
    auth: { host: '127.0.0.1', port: 19207 },
    firestore: { host: '127.0.0.1', port: 18207, websocketPort: 18208 },
    functions: { host: '127.0.0.1', port: 15207 },
    storage: { host: '127.0.0.1', port: 19208 },
    hub: { host: '127.0.0.1', port: 14207 },
    logging: { host: '127.0.0.1', port: 14208 },
    eventarc: { host: '127.0.0.1', port: 19209 },
    tasks: { host: '127.0.0.1', port: 19210 },
    ui: { enabled: false },
    singleProjectMode: true,
  },
};
writeFileSync('.ai/local/firebase.demo.json', JSON.stringify(local, null, 2));
NODE
npm run build --workspace functions
npx firebase emulators:start --project demo-satsunicgo \
  --config .ai/local/firebase.demo.json --only auth,firestore,functions,storage
```

Leave the emulators running in that terminal, then start the frontend in another. Fresh emulators contain no team fixtures; use an approved demo export if you need the existing accounts and orders. The older `dev:demo` and seeding scripts use different fixed ports, so they are not the startup path for this shared environment.

### Check and build

```bash
npm run typecheck
npm run lint
npm test
npm run build --workspace functions
```

For a frontend-only beta build with Firebase client services disabled:

```bash
VITE_USE_EMULATORS=false VITE_BETA_RELEASE=true npm run build
```

For a connected build, use your authorised browser configuration with `VITE_USE_EMULATORS=false` and `VITE_BETA_RELEASE=false`, then run `npm run build`. Emulator mode is development-only.

The frontend build produces `dist/` and regenerates the public asset manifest used by Functions. These commands do not deploy anything.

`npm run test:rules`, `npm run test:http`, and `npm run test:restore` start isolated test emulators on the legacy ports in `firebase.json`. Run them in a coordinated test environment with those ports free. They can create and clean up fixture data; they should not target emulators someone is using for a demo.
