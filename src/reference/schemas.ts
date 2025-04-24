import z from "zod";

export const level = z.object({
  // cefr: z.string(),
  rank: z.number(),
});

export const notes = z.object({
  usage: z.string(),
  grammar: z.string(),
  context: z.string(),
  pronunciation: z.string(),
});

export type Notes = z.infer<typeof notes>;

export const meaning = z.object({
  partOfSpeech: z.string(),
  definition: z.string(),
  example: z.string(),
  // level: level,
  // tags: z.string().array(),
  synonyms: z.string().array(),
  // notes: notes,
});

export type Meaning = z.infer<typeof meaning>;

export const entry = z.object({
  word: z.string(),
  level: level,
  phonetics: z.object({
    // ipa: z.string(),
    simplified: z.string(),
  }),
  meanings: meaning.array(),
});

export type Entry = z.infer<typeof entry>;
