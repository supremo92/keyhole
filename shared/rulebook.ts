// The Operator's Rulebook.
//
// Behind every door sits an Operator who cannot read your notes. They answer them anyway,
// by matching shapes against these rules (first match wins) and copying out the reply.
// That's the Chinese Room thought experiment (John Searle, 1980): the replies can look
// like understanding, but nobody inside understands a word.
//
// Shared by the Worker (which writes the replies) and the front end (which shows the book).

export type Reply = { text: string; rule: number };

type Paper = { title: string; body: string; all: string; lower: string };

type Rule = {
    no: number;
    // What the rule says, as written in the book.
    when: string;
    says: string;
    reply: (p: Paper) => string | null;
};

// A stable "random" pick, so the same paper always gets the same answer.
const choose = <T>(xs: T[], seed: string) => xs[[...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % xs.length];

const firstMatch = (p: Paper, re: RegExp) => p.lower.match(re)?.[1] ?? null;

const FOOD = /\b(milk|bread|eggs?|biscuits?|cheese|tea|coffee|cake|soup|apples?|bananas?|butter|jam|pasta|rice|chocolate|pizza)\b/;
const FEELINGS = /\b(love|miss|sad|happy|lonely|sorry|afraid|scared|angry|feel|feeling|tired)\b/;
const TIME = /\b(today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|deadline|soon|later|week|weekend)\b/;

export const RULES: Rule[] = [
    {
        no: 2,
        when: "If the paper begins with a greeting,",
        says: "greet.",
        reply: (p) => (/^\s*(hello|hi|hey|dear|greetings|good morning|good evening)\b/.test(p.lower) ? "Hello." : null),
    },
    {
        no: 3,
        when: "If the paper contains the shape «help»,",
        says: "refer to page 404.",
        reply: (p) => (/\bhelp\b/.test(p.lower) ? "Help is described on page 404 of the Rulebook. Page 404 is missing." : null),
    },
    {
        no: 5,
        when: "If the paper contains the shape «cat»,",
        says: "consult the cat.",
        reply: (p) => (/\bcats?\b/.test(p.lower) ? "The cat is not covered by the Rulebook. The cat may be above the Rulebook." : null),
    },
    {
        no: 8,
        when: "If the paper contains a shape from the FOOD list,",
        says: "acknowledge the shape, loudly.",
        reply: (p) => {
            const food = firstMatch(p, FOOD);
            return food ? `${food.toUpperCase()} ACKNOWLEDGED. FILED UNDER NOURISHMENT.` : null;
        },
    },
    {
        no: 13,
        when: "If the paper mentions keyholes, doors or looking,",
        says: "ask politely.",
        reply: (p) => (/\b(keyholes?|doors?|peek\w*|spy\w*|watch\w*|looking)\b/.test(p.lower) ? "Please stop looking through the keyhole." : null),
    },
    {
        no: 21,
        when: "If the paper contains a shape from the FEELINGS list,",
        says: "use the drawer marked OTHER.",
        reply: (p) =>
            FEELINGS.test(p.lower) ? "Feelings are not covered by the Rulebook. Yours have been placed in the drawer marked OTHER." : null,
    },
    {
        no: 34,
        when: "If the paper contains a shape from the TIME list,",
        says: "file the time.",
        reply: (p) => {
            const when = firstMatch(p, TIME);
            return when ? `"${when[0].toUpperCase()}${when.slice(1)}" has been received and filed. Please do not send more time.` : null;
        },
    },
    {
        no: 55,
        when: "If the paper contains the hook-shaped mark (?),",
        says: "draw an answer from the jar.",
        reply: (p) =>
            p.all.includes("?")
                ? choose(["Yes.", "No.", "Yes, but only on Thursdays.", "The answer has been filed. You may not see it.", "Ask the cat."], p.all)
                : null,
    },
    {
        no: 89,
        when: "If the paper contains numbers,",
        says: "add them up. This seems important.",
        reply: (p) => {
            const nums = p.all.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
            if (nums.length === 0) return null;
            if (nums.length === 1) return `Your number has been increased by one, to ${nums[0] + 1}. You're welcome.`;
            const sum = Math.round(nums.reduce((a, b) => a + b, 0) * 100) / 100;
            return `THE NUMBERS ADD UP TO ${sum}. THIS SEEMED IMPORTANT.`;
        },
    },
    {
        no: 144,
        when: "If there is nothing beneath the title,",
        says: "file it under ROOFS.",
        reply: (p) => (p.body.trim() === "" ? "A title with nothing underneath it. Filed under ROOFS." : null),
    },
    {
        no: 233,
        when: "If the paper has too many shapes,",
        says: "file it by weight.",
        reply: (p) => (p.all.length > 280 ? `Too many shapes (${p.all.length}). Filed by weight.` : null),
    },
    {
        no: 377,
        when: "Otherwise,",
        says: "copy out the biggest shapes, backwards.",
        reply: (p) => {
            const words = [...new Set(p.all.match(/[\p{L}']{4,}/gu) ?? [])];
            const big = words.sort((a, b) => b.length - a.length).slice(0, 3).reverse();
            return big.length ? `RECEIVED: ${big.join(" ").toUpperCase()}. NO FURTHER ACTION REQUIRED.` : "RECEIVED. NO FURTHER ACTION REQUIRED.";
        },
    },
];

// Rules about the room itself, printed at the front of the book.
export const HOUSE_RULES: { no: number; text: string }[] = [
    { no: 0, text: "Do not attempt to understand the papers." },
    { no: 4, text: "Each paper goes on the next free piece of furniture. The furniture is chosen by the dice." },
    { no: 6, text: "Papers beyond the eighth go on the floor. The floor does not mind." },
    { no: 40, text: "If the cat sits on a paper, the paper belongs to the cat." },
    { no: 99, text: "Anyone looking through the keyhole is to be ignored." },
];

export function operatorReply(title: string, body: string): Reply {
    const all = `${title}\n${body}`;
    const paper: Paper = { title, body, all, lower: all.toLowerCase() };
    for (const rule of RULES) {
        const text = rule.reply(paper);
        if (text) return { text, rule: rule.no };
    }
    return { text: "RECEIVED.", rule: 0 };
}
