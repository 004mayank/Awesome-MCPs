import { z } from 'zod';
export declare const StepSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"goto">;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "goto";
    url: string;
}, {
    type: "goto";
    url: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"click">;
    selector: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "click";
    selector: string;
}, {
    type: "click";
    selector: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"type">;
    selector: z.ZodString;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "type";
    selector: string;
    text: string;
}, {
    type: "type";
    selector: string;
    text: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"waitFor">;
    ms: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "waitFor";
    ms: number;
}, {
    type: "waitFor";
    ms: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"screenshot">;
    path: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "screenshot";
    path?: string | undefined;
}, {
    type: "screenshot";
    path?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"extractText">;
    selector: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "extractText";
    selector?: string | undefined;
}, {
    type: "extractText";
    selector?: string | undefined;
}>]>;
export type Step = z.infer<typeof StepSchema>;
export declare const PlanResponseSchema: z.ZodObject<{
    done: z.ZodBoolean;
    reason: z.ZodOptional<z.ZodString>;
    steps: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"goto">;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "goto";
        url: string;
    }, {
        type: "goto";
        url: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"click">;
        selector: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "click";
        selector: string;
    }, {
        type: "click";
        selector: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"type">;
        selector: z.ZodString;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "type";
        selector: string;
        text: string;
    }, {
        type: "type";
        selector: string;
        text: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"waitFor">;
        ms: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "waitFor";
        ms: number;
    }, {
        type: "waitFor";
        ms: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"screenshot">;
        path: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "screenshot";
        path?: string | undefined;
    }, {
        type: "screenshot";
        path?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"extractText">;
        selector: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "extractText";
        selector?: string | undefined;
    }, {
        type: "extractText";
        selector?: string | undefined;
    }>]>, "many">>;
}, "strip", z.ZodTypeAny, {
    done: boolean;
    steps: ({
        type: "goto";
        url: string;
    } | {
        type: "click";
        selector: string;
    } | {
        type: "type";
        selector: string;
        text: string;
    } | {
        type: "waitFor";
        ms: number;
    } | {
        type: "screenshot";
        path?: string | undefined;
    } | {
        type: "extractText";
        selector?: string | undefined;
    })[];
    reason?: string | undefined;
}, {
    done: boolean;
    reason?: string | undefined;
    steps?: ({
        type: "goto";
        url: string;
    } | {
        type: "click";
        selector: string;
    } | {
        type: "type";
        selector: string;
        text: string;
    } | {
        type: "waitFor";
        ms: number;
    } | {
        type: "screenshot";
        path?: string | undefined;
    } | {
        type: "extractText";
        selector?: string | undefined;
    })[] | undefined;
}>;
export type PlanResponse = z.infer<typeof PlanResponseSchema>;
