import { Command } from "commander";
import { Context } from "@/etc/Context";
import { ccgpt, CcgptOptions } from "@/etc/openai";
import { z } from "zod";
import { clearLogs } from "@/etc/clearLogs";
import { Entry, Meaning, Notes } from "@/schemas";
import * as schemas from "@/schemas";
import { parseInt } from "lodash";
import path from "path";
import { writeFileSync } from "fs";

// controls
const number = 1;
const words = ["dryer", "light", "break"];
interface WordMeaning {
  examplePhrase: string;
  partOfSpeech: string;
}

const getWordDescription = (word: string, sense: WordMeaning) => {
  return `${word} (${sense.partOfSpeech}) as in "${sense.examplePhrase}"`;
};

const getCefr = async (ctx: Context, wordDescription: string) => {
  const schema = z.string().regex(/^[A-Z0-9]{1,3}$/);
  const prompt = `Give me a CEFR ranking for the word ${wordDescription}, will be used in a ESL dictionary. Just give me a value, no explanation.`;

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 5,
    prompt,
    plainText: true,
    schema,
    model: "gpt-4o-mini",
  };

  return schema.parse(await ccgpt("cefr", cefrLevelOptions)) as z.infer<
    typeof schema
  >;
};

const getRank = async (ctx: Context, wordDescription: string) => {
  const schema = z.string().regex(/^[0-9]{1,2}$/);

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 5,
    prompt: `Give me a difficulty ranking (0-10) for the word ${wordDescription}, will be used in a ESL dictionary. Just give me a value, no explanation.`,
    plainText: true,
    schema,
    model: "gpt-4o-mini",
  };

  const raw = schema.parse(await ccgpt("rank", cefrLevelOptions)) as z.infer<
    typeof schema
  >;

  return parseInt(raw);
};

const getMeanings = async (ctx: Context, word: string) => {
  const schema = z.object({
    meanings: z
      .object({
        partOfSpeech: z.string(),
        examplePhrase: z.string(),
      })
      .array(),
  });

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 500,
    prompt: `Give me a list of common meanings for the word ${word} as you would find in an ESL dictionary. Use a short example phrase that disambiguates each entry. Only include very common, straightforward usages of the word. Omit less common slangs and such. 1 entry for each meaning of the word. Be conservative, a single entry is fine.`,
    schema,
    model: "gpt-4o-mini",
  };

  const raw = schema.parse(
    await ccgpt("meanings", cefrLevelOptions),
  ) as z.infer<typeof schema>;

  return raw.meanings;
};

const getNotes = async (ctx: Context, wordDescription: string) => {
  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 800,
    prompt: `Give me notes about the word ${wordDescription} as you would find in an ESL dictionary. Keep it brief and easy for English learners to understand. No phonetics or notation, only written notes. Don't mention the part of speech, assume that's included elsewhere.`,
    schema: schemas.notes,
    model: "gpt-4o-mini",
  };

  return schemas.notes.parse(await ccgpt("notes", cefrLevelOptions)) as Notes;
};

const getSynonyms = async (ctx: Context, wordDescription: string) => {
  const schema = z.string().regex(/^[a-z\-, ]+$/);

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 800,
    prompt: `Give me a list of synonyms for the word ${wordDescription}. Respond with a comma separated list of words or empty if there are no synonyms.`,
    schema,
    plainText: true,
    model: "gpt-4o-mini",
  };

  const raw = schema.parse(await ccgpt("synonyms", cefrLevelOptions)) as string;
  return raw.split(",").map((w) => w.trim().toLowerCase());
};

const getTags = async (ctx: Context, wordDescription: string) => {
  const schema = z.string().regex(/^[a-z\-, ]+$/);

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 800,
    prompt: `Give me a list of tags for the word ${wordDescription}. Respond with a comma separated list of tags or empty if there are no tags.`,
    schema,
    plainText: true,
    model: "gpt-4o-mini",
  };

  const raw = schema.parse(await ccgpt("tags", cefrLevelOptions)) as string;
  return raw.split(",").map((w) => w.trim().toLowerCase());
};

const getIpa = async (ctx: Context, wordDescription: string) => {
  const schema = z.string();

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 20,
    prompt: `Give me the IPA notation for the word ${wordDescription}. Respond with only the IPA word, no explanation.`,
    plainText: true,
    schema,
    model: "gpt-4o-mini",
  };

  return schema.parse(await ccgpt("ipa", cefrLevelOptions)) as z.infer<
    typeof schema
  >;
};

const getSimplifiedPhonetic = async (ctx: Context, wordDescription: string) => {
  const schema = z.string();

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 20,
    prompt: `Give me the simplified phonetic (normal alphabet not IPA) notation for the word ${wordDescription}. Respond with only the phonetic word, no explanation.`,
    plainText: true,
    schema,
    model: "gpt-4o-mini",
  };

  return schema.parse(
    await ccgpt("simplified-phonetic", cefrLevelOptions),
  ) as z.infer<typeof schema>;
};

const program = new Command();
program.name("wordlab").version("1.0.0");
clearLogs();

program.action(async () => {
  const ctx = new Context({});

  await Context.start(ctx, async () => {
    const results: Entry[] = [];

    for (const word of words) {
      const simpleMeanings = await getMeanings(ctx, word);

      const meanings: Meaning[] = [];

      for (const simpleMeaning of simpleMeanings) {
        const wordDescription = getWordDescription(word, simpleMeaning);

        const meaning: Meaning = {
          partOfSpeech: simpleMeaning.partOfSpeech,
          example: simpleMeaning.examplePhrase,
          level: {
            cefr: await getCefr(ctx, wordDescription),
            rank: await getRank(ctx, wordDescription),
          },
          notes: await getNotes(ctx, wordDescription),
          synonyms: await getSynonyms(ctx, wordDescription),
          tags: await getTags(ctx, wordDescription),
        };

        meanings.push(schemas.meaning.parse(meaning));
      }

      const entry: Entry = {
        word,
        level: {
          cefr: await getCefr(ctx, word),
          rank: await getRank(ctx, word),
        },
        meanings,
        phonetics: {
          ipa: await getIpa(ctx, word),
          simplified: await getSimplifiedPhonetic(ctx, word),
        },
      };

      results.push(schemas.entry.parse(entry));
    }

    const filePath = path.join(__dirname, "..", `result-${number}.json`);
    writeFileSync(filePath, JSON.stringify(results, null, 2));
  });
});

program.parse();
