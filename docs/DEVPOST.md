# Life Ledger

## Tagline

Small choices. Real growth. A financial life game that makes the consequences visible.

## Inspiration

Your first paycheque, a surprise repair, a credit balance that quietly grows: early money decisions are hard to picture. We wanted to turn abstract balances into a place you can understand at a glance.

## What it does

Life Ledger is a 3–5 minute game following Maya, a 19-year-old student with a part-time job, through a fictional year. Players make five decisions on the left and see the consequences in a living 3D town on the right.

Saving builds a shield around Maya's home. Interest pulls coins toward a red debt drain. Investing sends money to sector buildings that grow or shrink with fixed fictional market events. A separate tuition fund builds the foundation for a near-term goal. Replay the year and compare two paths side by side.

Every animation is paired with a plain-language explanation. The full game works without 3D, supports keyboard input and reduced motion, and requires no account.

## How we built it

React and TypeScript render the story and dashboard. React Three Fiber and Three.js bring a miniature Kenney town to life. Motion animates interface transitions and a state-driven net-worth chart. A pure calculation engine handles money; local JSON defines the story and market sequence. Browser storage keeps the last completed run.

We test every valid story path against an accounting identity so every balance reconciles to the cent. We also test the real browser flow, including replay, comparison, mobile layout, and unavailable WebGL/storage.

## What we learned

Financial effects work best when a player can explain each one. A shrinking shield is savings paying a repair, rather than a penalty for saving. Diversification changes exposure; it doesn't erase risk. A goal needed soon belongs in a different conversation from a long-term investment.

## Built with

React, TypeScript, Vite, React Three Fiber, Three.js, Drei, Motion, Lucide, Kenney, Playwright.

## Submission assets

- `artifacts/life-ledger-desktop.png`: the first decision and full town.
- `artifacts/life-ledger-downturn.png`: debt and market consequences.
- `artifacts/life-ledger-compare.png`: two completed paths.
- `artifacts/life-ledger-mobile.png`: mobile layout.
- One-minute demo: see `docs/DEMO.md` and the recording in `artifacts/`.

## Before publishing

Add the deployed app URL, source repository URL, team details, and hosted one-minute video URL. Attach screenshots. Select the Investly prize opt-in in the actual hackathon form. No Investly integration is claimed. Review the event's current requirements in your Devpost account before submitting.

All financial outcomes are fictional. Kenney models and sounds are CC0; fonts are OFL. Credits and original licenses are included in the repository.
