import { z } from 'zod';

export const StepSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('goto'), url: z.string().url() }),
  z.object({ type: z.literal('click'), selector: z.string() }),
  z.object({ type: z.literal('type'), selector: z.string(), text: z.string() }),
  z.object({ type: z.literal('waitFor'), ms: z.number().int().min(0) }),
  z.object({ type: z.literal('screenshot'), path: z.string().optional() }),
  z.object({ type: z.literal('extractText'), selector: z.string().optional() }),
]);

export type Step = z.infer<typeof StepSchema>;

export const PlanResponseSchema = z.object({
  done: z.boolean(),
  reason: z.string().optional(),
  steps: z.array(StepSchema).default([]),
});

export type PlanResponse = z.infer<typeof PlanResponseSchema>;
