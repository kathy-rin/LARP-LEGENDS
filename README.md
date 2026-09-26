# Life Ledger

A little town. A year of choices. A short financial life game for someone managing money for the first time.

## Run locally

Requires Node.js 22.12+ (tested on Node 24).

```sh
npm install
npm run dev
```

Open the local URL Vite prints. Production: `npm run build`, then `npm run preview`. Deploy the `dist` folder to any static host; no environment variables or backend are required.

## Play

You are Maya, age 19. Make five choices across January, March, May, July, and October. Select a card (or press 1–3), confirm, then continue. Every intervening month is accounted for. The final choice settles the year through December. Mouse and keyboard both work; Tab/Enter operate every control.

Your bank holds cash, your home's shield represents emergency savings, a red drain shows credit-card debt, sector buildings represent investments, and a construction site shows tuition savings. The explanatory text and exact ledger work even without WebGL. Reduced motion is respected. Sounds are opt-in.

Completed runs are saved in browser storage. Replay and compare the current path against the previous completed run. Storage failures do not stop play.

## Financial model

`src/engine.ts` is the pure, deterministic source of all balances. UI and scene only display its results. `src/data/story.json` defines the story; `src/data/markets.json` defines the fixed, fictional returns.

- Start with $400 cash; January's $500 surplus is already deposited when play begins.
- Monthly take-home income: $2,200; essentials: $1,700.
- Debt accrues interest at a fictional 20% APR / 12, rounded to cents each month, before a payment of up to $50 from cash. No fees or extra payments.
- Transfers preserve net worth. Purchases are expenses; purchased assets have no resale value in the model.
- Emergency target: $1,500. Separate near-term tuition target: $1,500. Cash and savings earn no interest.
- August returns: technology +8%, energy +3%, retail +2%. October: −35%, −8%, −12%. December: +6%, +2%, +1%. Other months: zero.
- Net worth = cash + emergency savings + tuition savings + investments − debt.
- Ledger invariant: net worth = $400 + $500 × elapsed months − purchases − cumulative interest + cumulative market change.
- The dashboard rounds dollars for readability; ledger and comparison show cents. Coins are symbolic and proportionate, not one coin per dollar.

All balances, scenarios, sectors, and outcomes are fictional. The fixed rebound is a scenario, not a forecast. The game makes no guarantee that holding investments recovers losses.

## Checks and demo

```sh
npm test
npm run build
npm run test:e2e
```

The engine tests exhaustively reconcile all 60 valid paths and check deterministic replay, cent rounding, transfers, selling, and invalid choices. Browser tests use installed Google Chrome, run two investment paths, check persistence, mobile overflow, cash goals, and disabled WebGL/storage. The browser tests start Vite automatically if needed and save screenshots to `artifacts/`.

Demo recording instructions and the one-minute narration are in `docs/DEMO.md`. Devpost copy is in `docs/DEVPOST.md`. Uploading/publishing the submission and selecting the Investly prize are manual account actions.

## Assets and implementation

React, TypeScript, Vite, React Three Fiber / Three.js, Drei, Motion, and Lucide. The state-driven SVG net-worth chart uses Motion and adapts the interaction direction of the linked [Bklit live-line chart](https://bklit.com/docs/components/live-line-chart) to discrete simulated months; there is no live market feed or fabricated streaming data.

Kenney CC0 assets: City Kit Suburban, Commercial, Industrial, Roads, Blocky Characters, Nature Kit, and Interface Sounds. Only selected models, their textures, and four sounds are shipped. Texture atlases are named per pack to prevent collisions. Three.js renders custom coins, trails, the shield, storm, construction, and an animated turbine. Font files are served locally (DM Sans and Manrope, OFL). See `public/licenses/` and `docs/ASSETS.md`.

No login, server, AI service, analytics, or Investly integration.
