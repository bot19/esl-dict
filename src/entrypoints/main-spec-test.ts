import { Command } from "commander";
import { Context } from "@/etc/Context";
import { ccgpt, CcgptOptions } from "@/etc/openai";
import { z } from "zod";
import { clearLogs } from "@/etc/clearLogs";
import { Entry, Meaning } from "@/schemas";
import * as schemas from "@/schemas";
import { parseInt } from "lodash";
import path from "path";
import { writeFileSync } from "fs";

// controls
const entryType = "test";
const entryIdentifier = "phonetic-simp-fail";
const entryNumber = 3;
const words: string[] = ["cue"];
const noContent = {
  wordFamily: "no related words",
  synonyms: "no synonyms available",
};

interface WordMeaning {
  examplePhrase: string;
  partOfSpeech: string;
}

const getWordDescription = (word: string, sense: WordMeaning) => {
  return `${word} (${sense.partOfSpeech}) as in "${sense.examplePhrase}"`;
};

// updated
const getRank = async (ctx: Context, wordDescription: string) => {
  const schema = z.string().regex(/^[0-9]{1,2}$/);

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 5,
    prompt: `for the word ${wordDescription}, give a rank of importance for ESL learners, 1 = most essential, 10 = least essential. Just give me a value, no explanation.`,
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
    prompt: `Give me a concise list of the core meanings for the word "${word}" as you would find in an English-UK ESL dictionary. Limit it to only the most common, clearly distinct meanings. Do not repeat similar uses or closely related senses. Use just one entry per true meaning, and avoid breaking it into multiple slight variations. Include one short, disambiguating example phrase per entry. Avoid slang, idioms, or edge cases. Be conservative: if a word has only one main use, return only that.`,
    schema,
    model: "gpt-4o-mini",
  };

  const raw = schema.parse(
    await ccgpt("meanings", cefrLevelOptions)
  ) as z.infer<typeof schema>;

  return raw.meanings;
};

// new
const getDefinition = async (ctx: Context, wordDescription: string) => {
  const schema = z.string();

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 100,
    prompt: `For the word: ${wordDescription}, give me a clear, English-UK ESL-friendly definition. Just the definition part, don't need to include the word and part of speech again. Keep it simple and easy to understand.`,
    plainText: true,
    schema,
    model: "gpt-4o-mini",
  };

  return schema.parse(
    await ccgpt("sense-definition", cefrLevelOptions)
  ) as z.infer<typeof schema>;
};

// new
const getWordFamily = async (ctx: Context, word: string) => {
  const schema = z.string().regex(/^[a-z\-,’' ]+$/i);

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 150,
    prompt: `for the word: ${word}; provide an optional list of related words or forms (Word Families or Derivatives). Don't include the word itself (${word}). Respond with a comma separated list of words or if there are no related words: ${noContent.wordFamily}`,
    schema,
    plainText: true,
    model: "gpt-4o-mini",
  };

  const raw = schema.parse(
    await ccgpt("word-family", cefrLevelOptions)
  ) as string;
  return raw.split(",").map((w) => w.trim().toLowerCase());
};

// new
const getHelpfulNote = async (ctx: Context, wordDescription: string) => {
  const schema = z.string();

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 200,
    prompt: `For the word: ${wordDescription}, give me a (1) clear, English-UK ESL-friendly helpful note. Could be related to: usage, grammar, context or pronunciation. Just the note part, don't need to include the word and part of speech again. Keep it simple and easy to understand.`,
    plainText: true,
    schema,
    model: "gpt-4o-mini",
  };

  return schema.parse(await ccgpt("helpful-note", cefrLevelOptions)) as z.infer<
    typeof schema
  >;
};

const getSynonyms = async (ctx: Context, wordDescription: string) => {
  // accepts: a-z, -, ’ or ', comma, space, case insensitive
  const schema = z.string().regex(/^[a-z\-,’' ]+$/i);

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 150,
    prompt: `Give me a list of synonyms for the word ${wordDescription}. Respond with a comma separated list of those synonyms or if there are no synonyms: "${noContent.synonyms}" (no quotes). Avoid punctuation (don't want phrases) except for the comma to separate the synonyms.`,
    schema,
    plainText: true,
    model: "gpt-4o-mini",
  };

  const raw = schema.parse(await ccgpt("synonyms", cefrLevelOptions)) as string;
  return raw.split(",").map((w) => w.trim().toLowerCase());
};

// updated
const getSimplifiedPhonetic = async (ctx: Context, word: string) => {
  const schema = z.string();

  const cefrLevelOptions: CcgptOptions = {
    ctx,
    maxTokens: 20,
    prompt: `For the word "${word}": give an easy, phonetic-style rendering that mimics how native English speakers might 'sound it out' using (only) regular alphabet letters—especially useful for learners unfamiliar with IPA. Respond with only the phonetic word, no explanation.`,
    plainText: true,
    schema,
    model: "gpt-4o-mini",
  };

  const result = schema.parse(
    await ccgpt("simplified-phonetic", cefrLevelOptions)
  ) as z.infer<typeof schema>;

  return result;
};

const program = new Command();
program.name("wordlab").version("1.0.0");
clearLogs();

program.action(async () => {
  const ctx = new Context({});

  if (words.length === 0) return console.log("no words to process");

  // init
  console.log("processing words:", words);

  await Context.start(ctx, async () => {
    const results: Entry[] = [];

    for (const word of words) {
      // get meanings/senses of word (1-many)
      const simpleMeanings = await getMeanings(ctx, word);

      const meanings: Meaning[] = [];

      for (const simpleMeaning of simpleMeanings) {
        const wordDescription = getWordDescription(word, simpleMeaning);

        const meaning: Meaning = {
          partOfSpeech: simpleMeaning.partOfSpeech,
          example: simpleMeaning.examplePhrase,
          definition: await getDefinition(ctx, wordDescription),
          note: await getHelpfulNote(ctx, wordDescription),
          synonyms: await getSynonyms(ctx, wordDescription),
        };

        meanings.push(schemas.meaning.parse(meaning));
      }

      const entry: Entry = {
        word,
        level: {
          rank: await getRank(ctx, word),
        },
        phonetics: {
          simplified: await getSimplifiedPhonetic(ctx, word),
        },
        wordFamily: await getWordFamily(ctx, word),
        meanings,
      };

      results.push(schemas.entry.parse(entry));
    }

    const filePath = path.join(
      __dirname,
      "..",
      `${entryType}-${entryIdentifier}-${entryNumber}.json`
    );
    writeFileSync(filePath, JSON.stringify(results, null, 2));
  });
});

program.parse();
