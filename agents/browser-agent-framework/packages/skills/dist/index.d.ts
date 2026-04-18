import { z } from 'zod';
export declare const StepSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"newPage">;
    pageId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "newPage";
    pageId: string;
}, {
    type: "newPage";
    pageId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"switchPage">;
    pageId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "switchPage";
    pageId: string;
}, {
    type: "switchPage";
    pageId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"closePage">;
    pageId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "closePage";
    pageId: string;
}, {
    type: "closePage";
    pageId: string;
}>, z.ZodObject<{
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
export declare const TaskSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"newPage">;
        pageId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "newPage";
        pageId: string;
    }, {
        type: "newPage";
        pageId: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"switchPage">;
        pageId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "switchPage";
        pageId: string;
    }, {
        type: "switchPage";
        pageId: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"closePage">;
        pageId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "closePage";
        pageId: string;
    }, {
        type: "closePage";
        pageId: string;
    }>, z.ZodObject<{
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
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    steps: ({
        type: "newPage";
        pageId: string;
    } | {
        type: "switchPage";
        pageId: string;
    } | {
        type: "closePage";
        pageId: string;
    } | {
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
    description?: string | undefined;
}, {
    name: string;
    steps: ({
        type: "newPage";
        pageId: string;
    } | {
        type: "switchPage";
        pageId: string;
    } | {
        type: "closePage";
        pageId: string;
    } | {
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
    description?: string | undefined;
}>;
export type Task = z.infer<typeof TaskSchema>;
export declare const SkillSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    tasks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        steps: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"newPage">;
            pageId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "newPage";
            pageId: string;
        }, {
            type: "newPage";
            pageId: string;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"switchPage">;
            pageId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "switchPage";
            pageId: string;
        }, {
            type: "switchPage";
            pageId: string;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"closePage">;
            pageId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "closePage";
            pageId: string;
        }, {
            type: "closePage";
            pageId: string;
        }>, z.ZodObject<{
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
        }>]>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        steps: ({
            type: "newPage";
            pageId: string;
        } | {
            type: "switchPage";
            pageId: string;
        } | {
            type: "closePage";
            pageId: string;
        } | {
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
        description?: string | undefined;
    }, {
        name: string;
        steps: ({
            type: "newPage";
            pageId: string;
        } | {
            type: "switchPage";
            pageId: string;
        } | {
            type: "closePage";
            pageId: string;
        } | {
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
        description?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    tasks: {
        name: string;
        steps: ({
            type: "newPage";
            pageId: string;
        } | {
            type: "switchPage";
            pageId: string;
        } | {
            type: "closePage";
            pageId: string;
        } | {
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
        description?: string | undefined;
    }[];
    description?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    version?: string | undefined;
    tasks?: {
        name: string;
        steps: ({
            type: "newPage";
            pageId: string;
        } | {
            type: "switchPage";
            pageId: string;
        } | {
            type: "closePage";
            pageId: string;
        } | {
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
        description?: string | undefined;
    }[] | undefined;
}>;
export type Skill = z.infer<typeof SkillSchema>;
export declare function loadSkill(filePath: string): Promise<Skill>;
export declare function loadTask(filePath: string): Promise<Task>;
