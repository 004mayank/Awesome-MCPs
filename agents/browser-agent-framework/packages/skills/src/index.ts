import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';

export const StepSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('goto'), url: z.string().url() }),
  z.object({ type: z.literal('click'), selector: z.string() }),
  z.object({ type: z.literal('type'), selector: z.string(), text: z.string() }),
  z.object({ type: z.literal('waitFor'), ms: z.number().int().min(0) }),
  z.object({ type: z.literal('screenshot'), path: z.string().optional() }),
  z.object({ type: z.literal('extractText'), selector: z.string().optional() })
]);

export type Step = z.infer<typeof StepSchema>;

export const TaskSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(StepSchema).min(1),
});

export type Task = z.infer<typeof TaskSchema>;

export const SkillSchema = z.object({
  name: z.string(),
  version: z.string().default('0.1.0'),
  description: z.string().optional(),
  tasks: z.array(TaskSchema).default([]),
});

export type Skill = z.infer<typeof SkillSchema>;

function parseByExt(filePath: string, raw: string): unknown {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.yaml' || ext === '.yml') return YAML.parse(raw);
  if (ext === '.json') return JSON.parse(raw);
  throw new Error(`Unsupported skill file extension: ${ext}`);
}

export async function loadSkill(filePath: string): Promise<Skill> {
  const raw = await readFile(filePath, 'utf-8');
  const obj = parseByExt(filePath, raw);
  return SkillSchema.parse(obj);
}

export async function loadTask(filePath: string): Promise<Task> {
  const raw = await readFile(filePath, 'utf-8');
  const obj = parseByExt(filePath, raw);
  return TaskSchema.parse(obj);
}
