import story from './data/story.json';
import markets from './data/markets.json';

export type Sector = 'technology' | 'energy' | 'retail';
export type Effect = { kind: 'income' | 'save' | 'spend' | 'debt' | 'interest' | 'invest' | 'market' | 'goal' | 'repair' | 'sell'; amount: number; sector?: Sector };
export type Entry = { month: number; label: string; cash: number; emergencySavings: number; creditCardDebt: number; goalSavings: number; investments: number; netWorth: number; interest: number; marketChange: number; spending: number };
export type GameState = {
  month: number; cash: number; emergencySavings: number; creditCardDebt: number;
  investmentsBySector: Record<Sector, number>; goalSavings: number;
  decisionHistory: { choice: string; title: string; month: number; explanation: string }[];
  step: number; phase: 'choice' | 'result' | 'complete'; explanation: string;
  effects: Effect[]; ledger: Entry[]; totalInterest: number; totalSpending: number; totalMarketChange: number;
};
export const RULES = { income: 2200, essentials: 1700, apr: 0.2, debtPayment: 50, emergencyGoal: 1500, tuitionGoal: 1500 };
export const sectors: Sector[] = ['technology', 'energy', 'retail'];
export const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
export const exactMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
export const portfolio = (s: GameState) => round(sectors.reduce((a, k) => a + s.investmentsBySector[k], 0));
export const netWorth = (s: GameState) => round(s.cash + s.emergencySavings + s.goalSavings + portfolio(s) - s.creditCardDebt);
function record(s: GameState, label: string) {
  s.ledger.push({ month: s.month, label, cash: s.cash, emergencySavings: s.emergencySavings, creditCardDebt: s.creditCardDebt, goalSavings: s.goalSavings, investments: portfolio(s), netWorth: netWorth(s), interest: s.totalInterest, marketChange: s.totalMarketChange, spending: s.totalSpending });
}
function advance(s: GameState, target: number) {
  while (s.month < target) {
    s.month++;
    const interest = round(s.creditCardDebt * RULES.apr / 12);
    const payment = Math.min(RULES.debtPayment, round(s.creditCardDebt + interest));
    s.creditCardDebt = round(s.creditCardDebt + interest - payment);
    s.cash = round(s.cash + RULES.income - RULES.essentials - payment);
    s.totalInterest = round(s.totalInterest + interest);
    s.effects.push({ kind: 'income', amount: RULES.income - RULES.essentials - payment });
    if (interest) s.effects.push({ kind: 'interest', amount: interest });
    const event = markets[String(s.month) as keyof typeof markets];
    if (event) sectors.forEach(sector => {
      const change = round(s.investmentsBySector[sector] * event[sector]);
      s.investmentsBySector[sector] = round(s.investmentsBySector[sector] + change);
      s.totalMarketChange = round(s.totalMarketChange + change);
      if (change) s.effects.push({ kind: 'market', amount: change, sector });
    });
    record(s, 'Monthly income, expenses, debt payment & market');
  }
}
export function initialState(): GameState {
  const s: GameState = { month: 0, cash: 400, emergencySavings: 0, creditCardDebt: 0, investmentsBySector: { technology: 0, energy: 0, retail: 0 }, goalSavings: 0, decisionHistory: [], step: 0, phase: 'choice', explanation: 'Your first $500 surplus has arrived at the bank. A little beginning, with plenty of possibility.', effects: [], ledger: [], totalInterest: 0, totalSpending: 0, totalMarketChange: 0 };
  record(s, 'Starting balances'); advance(s, 1); return s;
}
export function disabledReason(s: GameState, id: string): string | undefined {
  if (!story[s.step]?.choices.some(c => c.id === id)) return 'This choice is not available.';
  if (s.step === 0 && s.cash < 400) return 'You need $400 in cash.';
  if (s.step === 1 && id === 'cash' && s.cash < 800) return 'You need $800 in cash.';
  if (s.step === 2 && id === 'savings' && s.cash + s.emergencySavings < 900) return 'Savings and cash must cover $900.';
  if (s.step === 3 && s.cash < 900) return 'You need $900 in cash.';
  if (s.step === 4 && id === 'sell' && portfolio(s) === 0) return 'You have no investments to sell. Keep your cash plan.';
}
export function choose(state: GameState, id: string): GameState {
  if (state.phase !== 'choice') throw new Error('Continue to the next decision first.');
  const reason = disabledReason(state, id); if (reason) throw new Error(reason);
  const s = structuredClone(state); s.effects = [];
  let explanation = '';
  if (s.step === 0) {
    s.cash -= 400;
    if (id === 'save') { s.emergencySavings += 400; s.effects.push({ kind: 'save', amount: 400 }); explanation = '$400 moves from your bank to your emergency fund. The shield around your home grows: the money is still yours, ready for a surprise.'; }
    else { s.totalSpending += 400; s.effects.push({ kind: 'spend', amount: 400 }); explanation = 'You made some memories for $400. Your bank balance and net worth fall by $400, and your emergency cushion is still waiting to be built.'; }
  } else if (s.step === 1) {
    s.totalSpending += 800;
    if (id === 'cash') { s.cash -= 800; s.effects.push({ kind: 'spend', amount: 800 }); explanation = '$800 leaves the bank for your laptop. Your cash is lower, but no future paycheque owes interest on this purchase.'; }
    else { s.creditCardDebt += 800; s.effects.push({ kind: 'debt', amount: 800 }); explanation = 'Your cash stays put, but $800 of debt opens a red drain. Each month, interest is added at 20% APR ÷ 12, then $50 goes toward the balance.'; }
  } else if (s.step === 2) {
    const saved = id === 'credit' ? 0 : Math.min(900, s.emergencySavings);
    s.emergencySavings -= saved; const remaining = 900 - saved;
    s.totalSpending += 900;
    if (id === 'savings') s.cash -= remaining; else s.creditCardDebt += remaining;
    s.effects.push({ kind: 'repair', amount: saved }, { kind: id === 'savings' ? 'spend' : 'debt', amount: remaining });
    explanation = `${money(saved)} of emergency savings absorbs the repair; ${money(remaining)} comes from ${id === 'savings' ? 'cash' : 'new credit'}. ${saved ? 'Your shield shrinks because it did its job.' : 'Without a cushion, the full bill needs another source.'}`;
  } else if (s.step === 3) {
    s.cash -= 900;
    if (id === 'goal') { s.goalSavings += 900; s.effects.push({ kind: 'goal', amount: 900 }); explanation = '$900 moves into your tuition fund. Your goal building rises to 60% complete, and this cash stays outside the fictional market.'; }
    else {
      (id === 'tech' ? ['technology' as Sector] : sectors).forEach(sector => { const amount = id === 'tech' ? 900 : 300; s.investmentsBySector[sector] += amount; s.effects.push({ kind: 'invest', amount, sector }); });
      explanation = id === 'tech' ? '$900 flows to the technology tower. Your investment depends on one sector, so its ups and downs will be felt in full.' : 'Three streams carry $300 each into technology, energy, and retail. Diversification spreads exposure, but it cannot prevent every loss.';
    }
  } else {
    if (id === 'sell') { const value = portfolio(s); s.cash = round(s.cash + value); sectors.forEach(sector => { if (s.investmentsBySector[sector]) s.effects.push({ kind: 'sell', amount: s.investmentsBySector[sector], sector }); s.investmentsBySector[sector] = 0; }); }
    advance(s, 12);
    explanation = id === 'sell' ? 'You sold at the October value and held cash through December. The loss is realized; your money no longer moves with these sectors.' : portfolio(s) ? 'You stayed invested through December’s small fictional rebound. Your portfolio still carries market risk; waiting never guarantees a recovery.' : 'Your tuition money stayed in cash through December. A near-term goal avoided market swings, while monthly income kept building your bank balance.';
  }
  s.explanation = explanation;
  s.decisionHistory.push({ choice: id, title: story[s.step].choices.find(c => c.id === id)!.title, month: state.month, explanation });
  s.phase = 'result'; record(s, story[s.step].choices.find(c => c.id === id)!.title);
  return s;
}
export function continueGame(state: GameState): GameState {
  if (state.phase !== 'result') throw new Error('Make a choice first.');
  const s = structuredClone(state);
  if (s.step === 4) { s.phase = 'complete'; return s; }
  s.step++; s.phase = 'choice'; s.effects = [];
  const beforeInterest = s.totalInterest; const beforeMarket = s.totalMarketChange;
  advance(s, story[s.step].month);
  s.explanation = `Monthly paycheques and essentials are settled through ${monthName(s.month)}.${s.totalInterest > beforeInterest ? ` ${exactMoney(s.totalInterest - beforeInterest)} of interest flowed through the red drain.` : ''}${s.step === 4 ? ` Your portfolio changed by ${exactMoney(s.totalMarketChange - beforeMarket)} since July, including the August rise and October downturn.` : ''}`;
  return s;
}
export const monthName = (month: number) => ['Start', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month];
