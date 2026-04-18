import { type PlanResponse } from './schema.js';
import { type ChatMessage } from '../llm/providers.js';
export declare function planNext(args: {
    goal: string;
    observation: {
        url: string;
        textSnippet?: string;
    };
    history: ChatMessage[];
}): Promise<{
    plan: PlanResponse;
    history: ChatMessage[];
}>;
