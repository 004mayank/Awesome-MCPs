export type ChatMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};
export type LlmProvider = {
    completeJson: (args: {
        system: string;
        messages: ChatMessage[];
        jsonSchemaHint?: string;
    }) => Promise<unknown>;
};
export declare function getProvider(): LlmProvider;
