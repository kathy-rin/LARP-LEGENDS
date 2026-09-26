# One-minute demo

Record the real app at a desktop viewport, with the decisions and town visible. Keep sounds muted for narration. The automated recording follows the same choices through the interface; it does not inject financial state.

| Time | Action | Caption / narration |
| --- | --- | --- |
| 0–5s | Introduce Maya and the first decision | “Meet Maya. She's 19, and money choices are hard to picture.” |
| 5–12s | Save $400 | “In Life Ledger, an emergency fund becomes a shield around your home.” |
| 12–18s | Put the laptop on credit, continue | “Credit keeps cash available, but interest starts draining future income.” |
| 18–25s | Use savings and credit for the repair | “Then life happens. The shield absorbs $400 of a $900 repair.” |
| 25–33s | Invest in technology, continue to October | “Put everything in one sector, and one storm can hit hard.” |
| 33–39s | Remain invested, finish, replay | “What if Maya made one different choice?” |
| 39–50s | Replay the same first three choices; diversify | “Spread the same $900 across three sectors. Watch the districts respond differently.” |
| 50–56s | Finish, compare paths | “Same year. Same market. Two different outcomes.” |
| 56–60s | Hold the comparison | “Life Ledger makes the consequences of money decisions visible.” |

The video is a captioned screen recording, not narrated audio. Add the narration above if desired. The demonstration's partial December rebound is explicitly fictional; it is not a promise that waiting recovers investment losses.

To recreate the recording on this Mac: install Google Chrome and run `npx playwright install ffmpeg`. Keep `npm run dev` running on port 5173, then run `npm run demo` in another terminal. The script captures the real app and writes the video into `artifacts/`.

Upload the video to your chosen host and paste its URL into Devpost. Publishing and prize opt-in require your hackathon account.
