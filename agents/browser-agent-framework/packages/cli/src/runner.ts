import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { chromium, type Browser, type Page } from 'playwright';

const StepSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('goto'), url: z.string().url() }),
  z.object({ type: z.literal('click'), selector: z.string() }),
  z.object({ type: z.literal('type'), selector: z.string(), text: z.string() }),
  z.object({ type: z.literal('waitFor'), ms: z.number().int().min(0) }),
  z.object({ type: z.literal('screenshot'), path: z.string().optional() }),
  z.object({ type: z.literal('extractText'), selector: z.string().optional() }),
]);

const TaskSchema = z.object({
  name: z.string(),
  steps: z.array(StepSchema).min(1),
});

type Task = z.infer<typeof TaskSchema>;

type Event =
  | { type: 'task_start'; name: string }
  | { type: 'step_start'; index: number; step: unknown }
  | { type: 'step_result'; index: number; result: unknown }
  | { type: 'task_done' };

function emit(ev: Event) {
  process.stdout.write(JSON.stringify(ev) + '\n');
}

export async function runTaskFromFile(path: string, opts?: { runId?: string; artifactsDir?: string }) {
  const raw = await readFile(path, 'utf-8');
  const task: Task = TaskSchema.parse(JSON.parse(raw));

  const runId = opts?.runId || 'local';
  const artifactsDir = opts?.artifactsDir || process.env.BAF_ARTIFACTS_DIR || null;

  emit({ type: 'task_start', name: task.name });

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    for (let i = 0; i < task.steps.length; i++) {
      const step = task.steps[i];
      emit({ type: 'step_start', index: i, step });
      const result = await runStep(page, step, { runId, artifactsDir });
      emit({ type: 'step_result', index: i, result });
    }

    emit({ type: 'task_done' });
  } finally {
    await browser?.close().catch(() => {});
  }
}

function defaultScreenshotPath(params: { artifactsDir: string; runId: string; name?: string }) {
  const base = params.name || `screenshot-${Date.now()}`;
  return `${params.artifactsDir}/${params.runId}/${base}.png`;
}

async function runStep(
  page: Page,
  step: z.infer<typeof StepSchema>,
  ctx: { runId: string; artifactsDir: string | null }
) {
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
    case 'screenshot': {
      const p = ctx.artifactsDir
        ? defaultScreenshotPath({ artifactsDir: ctx.artifactsDir, runId: ctx.runId, name: step.path?.replace(/[^a-zA-Z0-9-_]/g, '_') })
        : (step.path || './screenshot.png');
      await page.screenshot({ path: p, fullPage: true });
      return { ok: true, path: p };
    }
    case 'extractText': {
      const txt = step.selector ? await page.textContent(step.selector) : await page.textContent('body');
      return { ok: true, text: txt ?? '' };
    }
  }
}
