import { test } from 'node:test';
import assert from 'node:assert/strict';
import story from './data/story.json';
import { choose, continueGame, disabledReason, initialState, netWorth, portfolio, round } from './engine';
import type { GameState } from './engine';

function checkAccounting(s: GameState) {
  for (const entry of s.ledger) {
    assert.equal(entry.netWorth, round(400 + entry.month * 500 - entry.spending - entry.interest + entry.marketChange), `Accounting did not reconcile: month ${entry.month}, ${entry.label}`);
    for (const key of ['cash', 'emergencySavings', 'creditCardDebt', 'goalSavings', 'investments'] as const) assert.ok(entry[key] >= 0, `${key} went negative`);
    assert.equal(entry.netWorth, round(entry.cash + entry.emergencySavings + entry.goalSavings + entry.investments - entry.creditCardDebt));
  }
}
function play(ids: string[]) {
  return ids.reduce((s, id) => continueGame(choose(s, id)), initialState());
}
test('starting cash includes January surplus, without creating free savings', () => {
  const s = initialState(); assert.equal(s.cash, 900); assert.equal(s.month, 1); assert.equal(netWorth(s), 900); checkAccounting(s);
});
test('saving preserves net worth, spending consumes it, and inputs stay immutable', () => {
  const before = initialState(); const saved = choose(before, 'save'); const spent = choose(before, 'spend');
  assert.equal(before.cash, 900); assert.equal(before.decisionHistory.length, 0);
  assert.equal(saved.emergencySavings, 400); assert.equal(saved.cash, 500); assert.equal(netWorth(saved), 900); assert.equal(netWorth(spent), 500);
});
test('20% APR interest is rounded monthly and charged before a $50 payment', () => {
  const march = continueGame(choose(initialState(), 'save'));
  const may = continueGame(choose(march, 'credit'));
  assert.equal(may.totalInterest, 26.05); assert.equal(may.creditCardDebt, 726.05); assert.equal(may.cash, 2400); checkAccounting(may);
});
test('repair consumes savings first, then the selected funding source', () => {
  const may = play(['save', 'cash']); const cash = choose(may, 'savings'); const mixed = choose(may, 'mixed');
  assert.equal(cash.emergencySavings, 0); assert.equal(cash.cash, may.cash - 500); assert.equal(cash.creditCardDebt, 0);
  assert.equal(mixed.creditCardDebt, 500); assert.equal(mixed.cash, may.cash); checkAccounting(cash); checkAccounting(mixed);
});
test('diversification reduces this scenario’s downturn loss and is deterministic', () => {
  const concentrated = play(['save', 'cash', 'savings', 'tech']); const diversified = play(['save', 'cash', 'savings', 'diversify']);
  assert.equal(portfolio(concentrated), 631.8); assert.equal(portfolio(diversified), 764.16);
  assert.deepEqual(concentrated, play(['save', 'cash', 'savings', 'tech']));
  assert.ok(diversified.effects.some(e => e.kind === 'market' && e.amount < 0));
});
test('selling locks proceeds into cash and remaining invested never avoids all loss', () => {
  const october = play(['save', 'cash', 'savings', 'tech']); const sold = choose(october, 'sell'); const held = choose(october, 'hold');
  assert.equal(portfolio(sold), 0); assert.equal(sold.month, 12); assert.equal(sold.cash, round(october.cash + 631.8 + 1000));
  assert.equal(portfolio(held), 669.71); assert.ok(portfolio(held) < 900); checkAccounting(sold); checkAccounting(held);
});
test('near-term goal money stays outside the market', () => {
  const s = play(['spend', 'credit', 'credit', 'goal', 'hold']);
  assert.equal(s.goalSavings, 900); assert.equal(s.totalMarketChange, 0); assert.equal(s.phase, 'complete'); checkAccounting(s);
});
test('all valid story paths reconcile to the cent and each decision changes a number', () => {
  let completed = 0;
  function explore(s: GameState) {
    if (s.phase === 'complete') { assert.equal(s.month, 12); assert.equal(s.decisionHistory.length, 5); completed++; return; }
    for (const c of story[s.step].choices) {
      if (disabledReason(s, c.id)) continue;
      const result = choose(s, c.id); checkAccounting(result);
      assert.notDeepEqual([s.cash, s.emergencySavings, s.creditCardDebt, s.goalSavings, portfolio(s)], [result.cash, result.emergencySavings, result.creditCardDebt, result.goalSavings, portfolio(result)]);
      assert.ok(result.effects.some(e => e.amount !== 0));
      const next = continueGame(result); checkAccounting(next); explore(next);
    }
  }
  explore(initialState()); assert.equal(completed, 60);
});
test('invalid, repeated, and unaffordable choices cannot mutate balances', () => {
  const s = initialState(); assert.throws(() => choose(s, 'unknown'));
  assert.throws(() => continueGame(s)); assert.throws(() => choose(choose(s, 'save'), 'save'));
  const poor = { ...s, cash: 20 }; assert.ok(disabledReason(poor, 'save')); assert.throws(() => choose(poor, 'save'));
  assert.equal(s.cash, 900);
});
