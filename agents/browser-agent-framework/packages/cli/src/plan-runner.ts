import { chromium } from 'playwright';
import { planNext } from '@baf/core';
import type { Step } from '@baf/core';

async function applyStep(page: any, step: Step) {
  switch (step.type) {
    case 'goto':
      await page.goto(step.url, { waitUntil: 'domcontentloaded' });
      return { ok: true };
    case 'click':
      await page.click(step.selector);
      return { ok: true };
    case 'type':
      await page.fill(step.selector, step.text);
      return { ok: true };
    case 'waitFor':
      await page.waitForTimeout(step.ms);
      return { ok: true };
    case 'extractText': {
      const txt = step.selector ? await page.textContent(step.selector) : await page.textContent('body');
      return { ok: true, text: txt ?? '' };
    }
    case 'screenshot': {
      const p = step.path ? `${step.path}.png` : `screenshot-${Date.now()}.png`;
      await page.screenshot({ path: p, fullPage: true });
      return { ok: true, path: p };
    }
  }
}

export async function planAndRun(args: { goal: string; startUrl?: string; maxTurns?: number }) {
  const maxTurns = args.maxTurns ?? 10;

  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    if (args.startUrl) await page.goto(args.startUrl, { waitUntil: 'domcontentloaded' });

    let history: any[] = [];

    for (let turn = 0; turn < maxTurns; turn++) {
      const url = page.url();
      const bodyText = (await page.textContent('body')) || '';

      const { plan, history: newHistory } = await planNext({
        goal: args.goal,
        observation: { url, textSnippet: bodyText.slice(0, 4000) },
        history,
      });
      history = newHistory;

      process.stdout.write(JSON.stringify({ type: 'plan', turn, plan }) + '\n');

      if (plan.done) break;
      for (const step of plan.steps.slice(0, 3)) {
        const result = await applyStep(page, step);
        process.stdout.write(JSON.stringify({ type: 'step', step, result }) + '\n');
      }
    }
  } finally {
    await browser.close();
  }
}
