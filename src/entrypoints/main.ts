import { Command } from "commander";
import { Context } from "@/etc/Context";
import { ccgpt, CcgptOptions } from "@/etc/openai";
import { z } from "zod";
import { clearLogs } from "@/etc/clearLogs";

const program = new Command();
program.name("wordlab").version("1.0.0");
clearLogs();
const words = ["dryer", "cat", "security"];

const levelSchema = z.object({
  cefr: z.string(),
  rank: z.number(),
});

const schema = z.object({
  word: z.string(),
  level: levelSchema,
  phonetics: z.object({
    ipa: z.string(),
    simplified: z.string(),
  }),
  meanings: z
    .object({
      partOfSpeech: z.string(),
      level: levelSchema,
      tags: z.string().array(),
      synonyms: z.string().array(),
    })
    .array(),
  notes: z
    .object({
      type: z.enum(["usage", "grammar", "context", "pronunciation"]),
      content: z.string(),
    })
    .array(),
});

type Entry = z.infer<typeof schema>;

program.action(async () => {
  const ctx = new Context({});

  await Context.start(ctx, async () => {
    const results: Entry[] = [];

    for (const word of words) {
      const cefrLevelOptions: CcgptOptions = {
        ctx,
        maxTokens: 5,
        prompt: `Give me a CEFR ranking for the word ${word}, will be used in a ESL dictionary. Just give me a value, no explanation.`,
        plainText: true,
        schema: z.string().regex(/^[A-Z0-9]{2,3}$/),
        model: "gpt-4o-mini",
      };

      const cefrLevel: string = await ccgpt("word-level", cefrLevelOptions);

      const entry: Entry = {
        word,
        level: {
          cefr: cefrLevel,
          rank: 0,
        },
        meanings: [],
        notes: [],
        phonetics: {
          ipa: "",
          simplified: "",
        },
      };

      results.push(schema.parse(entry));
    }

    console.log(results);
  });
});

program.parse();
